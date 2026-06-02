import { FieldType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { CreateFormInput, FormField, UpdateFormInput } from "./form.types.js";
import { generateSlug } from "../../utils/slug.js";

const fieldTypeMap: Record<FormField["type"], FieldType> = {
    text: FieldType.TEXT,
    textarea: FieldType.TEXTAREA,
    number: FieldType.NUMBER,
    email: FieldType.EMAIL,
    date: FieldType.DATE,
    select: FieldType.SELECT,
    radio: FieldType.RADIO,
    checkbox: FieldType.CHECKBOX,
};

const buildSectionCreateData = (section: NonNullable<CreateFormInput["sections"]>[number], sectionIndex: number) => ({
    title: section.title,
    description: section.description,
    sortOrder: sectionIndex,
    fields: section.fields?.length
        ? {
              create: section.fields.map((field, fieldIndex) => ({
                  label: field.label,
                  fieldKey: generateSlug(field.label),
                  fieldType: fieldTypeMap[field.type],
                  required: field.required ?? false,
                  sortOrder: fieldIndex,
                  options: field.options?.length
                      ? {
                            create: field.options.map((option) => ({
                                label: option,
                                value: option,
                            })),
                        }
                      : undefined,
              })),
          }
        : undefined,
});

export const createForm = async (data: CreateFormInput, createdById: string) => {
    return await prisma.form.create({
        data: {
            title: data.title,
            slug: generateSlug(data.title),
            description: data.description,
            isOpen: data.isOpen ?? true,
            deadline: data.deadline ? new Date(data.deadline) : undefined,
            createdBy: {
                connect: {
                    id: createdById,
                },
            },
            sections: data.sections?.length
                ? {
                      create: data.sections.map((section, sectionIndex) => buildSectionCreateData(section, sectionIndex)),
                  }
                : undefined,
        },
    });
};

export const updateForm = async (slug: string, data: UpdateFormInput) => {
    const existingForm = await prisma.form.findUnique({
        where: { slug },
        select: { id: true, slug: true },
    });

    if (!existingForm) {
        return null;
    }

    return await prisma.$transaction(async (transaction) => {
        await transaction.form.update({
            where: { slug },
            data: {
                title: data.title,
                description: data.description,
                isOpen: data.isOpen,
                deadline: data.deadline ? new Date(data.deadline) : undefined,
            },
        });

        if (data.sections !== undefined) {
            await transaction.formSection.deleteMany({ where: { formId: existingForm.id } });

            if (data.sections.length > 0) {
                await transaction.form.update({
                    where: { slug },
                    data: {
                        sections: {
                            create: data.sections.map((section, sectionIndex) => buildSectionCreateData(section, sectionIndex)),
                        },
                    },
                });
            }
        }

        return await getFormBySlug(slug);
    });
};

export const getAllForms = async () => {
    return await prisma.form.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            sections: {
                orderBy: {
                    sortOrder: "asc",
                },
                include: {
                    fields: {
                        orderBy: {
                            sortOrder: "asc",
                        },
                        include: {
                            options: true,
                        },
                    },
                },
            },
            submissions: {
                where: {
                    status: "SUBMITTED",
                },
                select: {
                    id: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
};

export const getFormBySlug = async (slug: string) => {
    return await prisma.form.findUnique({
        where: {
            slug,
        },
        include: {
            sections: {
                orderBy: {
                    sortOrder: "asc",
                },
                include: {
                    fields: {
                        orderBy: {
                            sortOrder: "asc",
                        },
                        include: {
                            options: true,
                        },
                    },
                },
            },
            accesses: {
                include: {
                    department: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    email: true,
                                    role: true,
                                },
                            },
                        },
                    },
                },
            },
            submissions: {
                where: {
                    status: "SUBMITTED",
                },
                include: {
                    submittedBy: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            role: true,
                        },
                    },
                    department: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    email: true,
                                    role: true,
                                },
                            },
                        },
                    },
                    submissionValue: {
                        include: {
                            field: {
                                include: {
                                    options: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
            createdBy: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
};


export const  findFormByTitle = async(title:string)=>{
    const slug=generateSlug(title)
    return prisma.form.findUnique({
        where:{
            slug:slug
        }
    })
}

// deleting the form by its id 

export const deleteForm = async(slug:string)=>{
    return prisma.form.delete({
        where:{
            slug:slug
        }
    })
}

// activating and deactivating the form 

export const toggleFormStatus = async (slug:string,isOpen:boolean)=>{
    return prisma.form.update(
        {
            where:{
                slug:slug
            },
            data:{
                isOpen:isOpen
            }
        }
    )
}