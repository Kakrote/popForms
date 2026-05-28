import { CreateSubmissionInput } from "./submission.types.js";
import { prisma } from "../../lib/prisma.js";

export const createSubmission = async (input: CreateSubmissionInput) => {
    return await prisma.submission.create({
        data: {
            formId: input.formId,
            departmentId: input.departmentId,
            submittedById: input.submittedById,
            status: input.status,
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

export const getAllSubmissions = async () => {
    return await prisma.submission.findMany({
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
                    field: true,
                },
            },
        },
    });
};

export const getSubmissionById = async (id: string) => {
    return await prisma.submission.findUnique({
        where: {
            id,
        },
        include: {
            form: {
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
        },
    });
};