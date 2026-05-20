import { catchAsync } from "../../utils/catchAsync.js";
import { createFormSchema } from "./form.validation.js";
import { createForm as createFormService } from "./form.service.js";
import { Request, Response } from "express";

type AuthenticatedRequest = Request & {
    user?: {
        id: string;
        role: "USER" | "ADMIN";
    };
};

export const createForm = catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
        const payload = createFormSchema.parse(req.body);

        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const form = await createFormService(payload, req.user.id);

        res.status(201).json({
            success: true,
            message: "Form created successfully",
            data: form,
        });
    }
);