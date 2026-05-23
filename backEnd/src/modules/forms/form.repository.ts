import { FieldType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { CreateFormInput, FormField } from "./form.types.js";
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
            fields: data.fields?.length
                ? {
                      create: data.fields.map((field, index) => ({
                          label: field.label,
                          fieldKey: generateSlug(field.label),
                          fieldType: fieldTypeMap[field.type],
                          required: field.required ?? false,
                          sortOrder: index,
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