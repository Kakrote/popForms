import { CreateSubmissionInput } from "./submission.types.js";
import { prisma } from "../../lib/prisma.js";

export const createSubmission = async (input: CreateSubmissionInput) => {
    return await prisma.submission.create({
        data: {
            formId: input.formId,
            departmentId: input.departmentId,
            submittedById: input.submittedById,
            status: input.status,
            isLocked: input.isLocked ?? false,
            submittedAt: input.submittedAt ? new Date(input.submittedAt) : undefined,
                submissionValue: input.values?.length
                    ? {
                            create: input.values.map((value) => ({
                                fieldId: value.fieldId,
                                value: value.value,
                            })),
                        }
                    : undefined,
            },
            include: {
                submissionValue: true,
            },
    });
};

export const updateSubmission = async (id: string, input: CreateSubmissionInput) => {
    return await prisma.submission.update({
        where: { id },
        data: {
            status: input.status,
            isLocked: input.isLocked ?? false,
            submittedAt: input.submittedAt ? new Date(input.submittedAt) : null,
            submissionValue: {
                deleteMany: {},
                create: input.values?.length
                    ? input.values.map((value) => ({
                          fieldId: value.fieldId,
                          value: value.value,
                      }))
                    : [],
            },
        },
        include: {
            submissionValue: true,
        },
    });
};

export const findSubmission = async (
    formId: CreateSubmissionInput["formId"],
    departmentId: CreateSubmissionInput["departmentId"]
) => {
    return await prisma.submission.findUnique({
        where: {
            formId_departmentId: {
                formId: formId,
                departmentId: departmentId,
            },
        },
    });
};

export const findUserSubmissionByForm = async (formId: string, submittedById: string) => {
    return await prisma.submission.findFirst({
        where: {
            formId,
            submittedById,
        },
        include: {
            submissionValue: {
                include: {
                    field: {
                        include: {
                            options: true,
                            section: true,
                        },
                    },
                },
            },
            form: {
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
                },
            },
            department: true,
            editHistories: {
                include: {
                    editedBy: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    editedAt: "desc",
                },
            },
        },
        orderBy: {
            updatedAt: "desc",
        },
    });
};

export const getAllSubmissions = async () => {
    return await prisma.submission.findMany({
        where: {
            status: "SUBMITTED",
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            form: true,
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
            submittedBy: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
            submissionValue: {
                include: {
                    field: {
                        include: {
                            options: true,
                            section: true,
                        },
                    },
                },
            },
        },
    });
};

export const getMySubmissions = async (submittedById: string) => {
    return await prisma.submission.findMany({
        where: {
            submittedById,
            status: "SUBMITTED",
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            form: true,
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
            submittedBy: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
            submissionValue: {
                include: {
                    field: {
                        include: {
                            options: true,
                            section: true,
                        },
                    },
                },
            },
            editHistories: {
                include: {
                    editedBy: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    editedAt: "desc",
                },
            },
        },
    });
};

export const getSubmissionById = async (id: string) => {
    return await prisma.submission.findFirst({
        where: {
            id,
            status: "SUBMITTED",
        },
        include: {
            form: {
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
            submittedBy: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
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
            editHistories: {
                include: {
                    editedBy: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    editedAt: "desc",
                },
            },
        },
    });
};

export const getMyDrafts = async (submittedById: string) => {
    return await prisma.submission.findMany({
        where: {
            submittedById,
            status: "DRAFT",
        },
        orderBy: {
            updatedAt: "desc",
        },
        include: {
            form: true,
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
            submittedBy: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
            submissionValue: {
                include: {
                    field: {
                        include: {
                            options: true,
                            section: true,
                        },
                    },
                },
            },
        },
    });
};

export const deleteSubmission = async (id: string) => {
    return await prisma.submission.delete({
        where: { id },
    });
};