import { catchAsync } from "../../utils/catchAsync.js";
import { createFormSchema } from "./form.validation.js";
import { createForm as createFormService, deleteForm as deleteFormService,toggleFormStatusService, listFormsService, getFormBySlugService } from "./form.service.js";
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

// deleting the form 

export const deleteForm = catchAsync(
    async (req: AuthenticatedRequest, res: Response) => {
        const { slug } = req.params;

        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        await deleteFormService(slug as string);

        res.status(200).json({
            success: true,
            message: "Form deleted successfully",
        });
    }
);


// activating and deactivating the form

export const toggleFormStatus = catchAsync(
    async(req: AuthenticatedRequest, res: Response) => {
        const { slug } = req.params;
        const { isOpen } = req.body;

        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const form = await toggleFormStatusService(slug as string, isOpen);

        res.status(200).json({
            success: true,
            message: `Form ${isOpen ? "activated" : "deactivated"} successfully`,
            data: form,
        });
    }
)

export const listForms = catchAsync(async (_req: Request, res: Response) => {
    const forms = await listFormsService();

    res.status(200).json({
        success: true,
        data: forms,
    });
});

export const getFormBySlug = catchAsync(async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const form = await getFormBySlugService(slug);

    res.status(200).json({
        success: true,
        data: form,
    });
});