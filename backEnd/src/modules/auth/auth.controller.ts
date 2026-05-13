import { Request, Response } from "express";
import {
  loginUser,
  registerUser,
} from "./auth.service.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

export const registerController = catchAsync(

    async (
        req: Request,
        res: Response
    ) => {
        const payload = registerSchema.parse(req.body);
        const user = await registerUser(payload);
        
        res.status(201).json({
            success: true,
            data: user,
        });
    }
);

export const loginController = catchAsync(
    async (
        req: Request,
        res: Response
    ) => {
        const payload = loginSchema.parse(req.body);
        const data = await loginUser(payload);

        res.json({
            success: true,
            data,
        });
    }
);
  