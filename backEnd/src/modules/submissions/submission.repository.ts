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