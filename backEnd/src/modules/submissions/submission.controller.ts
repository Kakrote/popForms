import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { submitForm, listSubmissions, getSubmission, listCurrentUserSubmissions, getCurrentUserSubmissionForForm, listCurrentUserDrafts, deleteSubmission } from "./submission.service.js";
import { createSubmissionSchema } from "./submission.validation.js";

type AuthenticatedRequest = Request & {
    user?: {
        id: string;
        role: "USER" | "ADMIN";
    };
};

export const submitFormHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const submittedById = req.user?.id as string;

    if (!submittedById) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = createSubmissionSchema.parse(req.body);

    const submission = await submitForm(payload, submittedById);

    res.status(201).json({
        status: "success",
        data: submission,
    });
});

export const getAllSubmissionsHandler = catchAsync(async (_req: Request, res: Response) => {
    const submissions = await listSubmissions();

    res.status(200).json({
        success: true,
        data: submissions,
    });
});

export const getSubmissionByIdHandler = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const submission = await getSubmission(id);

    res.status(200).json({
        success: true,
        data: submission,
    });
});

export const getCurrentUserSubmissionsHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const submittedById = req.user?.id;

    if (!submittedById) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const submissions = await listCurrentUserSubmissions(submittedById);

    res.status(200).json({
        success: true,
        data: submissions,
    });
});

export const getCurrentUserSubmissionByFormHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const submittedById = req.user?.id;
    const formId = req.params.formId as string;

    if (!submittedById) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const submission = await getCurrentUserSubmissionForForm(formId, submittedById);

    res.status(200).json({
        success: true,
        data: submission,
    });
});

export const getCurrentUserDraftsHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const submittedById = req.user?.id;

    if (!submittedById) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const submissions = await listCurrentUserDrafts(submittedById);

    res.status(200).json({
        success: true,
        data: submissions,
    });
});

export const deleteSubmissionHandler = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const requester = req.user as { id: string; role: "USER" | "ADMIN" };
    const { id } = req.params;

    if (!requester?.id) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const deleted = await deleteSubmission(id, requester);

    res.status(200).json({
        success: true,
        data: deleted,
    });
});