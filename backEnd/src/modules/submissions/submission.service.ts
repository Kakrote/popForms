import { AppError } from "../../utils/appError.js";
import { prisma } from "../../lib/prisma.js";
import { createSubmission, findSubmission } from "./submission.repository.js";
import { CreateSubmissionInput } from "./submission.types.js";

type CreateSubmissionPayload = Omit<CreateSubmissionInput, "submittedById">;

export const submitForm = async (
    input: CreateSubmissionPayload,
    submittedById: string
) => {
    const payload: CreateSubmissionInput = { ...input, submittedById };

    // ensure form exists
    const form = await prisma.form.findUnique({ where: { id: payload.formId } });
    if (!form) {
        throw new AppError("Form not found", 404);
    }
    // ensure the form is active 
    if(form.isOpen===false){
        throw new AppError("Form is closed for the submissions",400);
    }

    // ensure department exists
    const department = await prisma.department.findUnique({ where: { id: payload.departmentId } });
    if (!department) {
        throw new AppError("Department not found", 404);
    }

    const ifSubmissionExist = await findSubmission(payload.formId, payload.departmentId);
    if (ifSubmissionExist) {
        throw new AppError("Submission for this form already exist", 409);
    }

    return await createSubmission(payload);
};