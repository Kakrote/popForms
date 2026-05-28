import { AppError } from "../../utils/appError.js";
import { prisma } from "../../lib/prisma.js";
import { createSubmission, findSubmission, findUserSubmissionByForm, getAllSubmissions, getMySubmissions, getSubmissionById, updateSubmission } from "./submission.repository.js";
import { getMyDrafts, deleteSubmission as repoDeleteSubmission } from "./submission.repository.js";
import { CreateSubmissionInput } from "./submission.types.js";

type CreateSubmissionPayload = Omit<CreateSubmissionInput, "submittedById">;

export const submitForm = async (
    input: CreateSubmissionPayload,
    submittedById: string
) => {
    const desiredStatus = input.status ?? "SUBMITTED";
    const payload: CreateSubmissionInput = {
        ...input,
        submittedById,
        status: desiredStatus,
        submittedAt: desiredStatus === "SUBMITTED" ? new Date() : undefined,
        isLocked: desiredStatus === "SUBMITTED",
    };

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

    if (department.userId !== submittedById) {
        throw new AppError("You can only submit with your own department", 403);
    }

    const existingSubmission = await findSubmission(payload.formId, payload.departmentId);

    if (existingSubmission?.status === "SUBMITTED") {
        throw new AppError("This form is already submitted", 409);
    }

    if (existingSubmission) {
        return await updateSubmission(existingSubmission.id, payload);
    }

    return await createSubmission(payload);
};

export const listSubmissions = async () => {
    return await getAllSubmissions();
};

export const getSubmission = async (id: string) => {
    const submission = await getSubmissionById(id);

    if (!submission) {
        throw new AppError("Submission not found", 404);
    }

    return submission;
};

export const listCurrentUserSubmissions = async (submittedById: string) => {
    return await getMySubmissions(submittedById);
};

export const listCurrentUserDrafts = async (submittedById: string) => {
    return await getMyDrafts(submittedById);
};

export const deleteSubmission = async (id: string, requester: { id: string; role: "USER" | "ADMIN" }) => {
    // ensure exists
    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission) {
        throw new AppError("Submission not found", 404);
    }

    if (requester.role === "ADMIN") {
        return await repoDeleteSubmission(id);
    }

    // non-admin can only delete their own drafts
    if (submission.submittedById !== requester.id) {
        throw new AppError("Not allowed to delete this submission", 403);
    }

    if (submission.status !== "DRAFT") {
        throw new AppError("Only draft submissions can be deleted by users", 403);
    }

    return await repoDeleteSubmission(id);
};

export const getCurrentUserSubmissionForForm = async (formId: string, submittedById: string) => {
    return await findUserSubmissionByForm(formId, submittedById);
};