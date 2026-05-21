import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { submitForm } from "./submission.service.js";
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