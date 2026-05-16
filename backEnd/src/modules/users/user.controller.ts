import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { getAllUsers } from "./user.service.js";

export const getUsers = catchAsync(async (_req: Request, res: Response) => {
    const users = await getAllUsers();
    res.status(200).json({
        success: true,
        data: users,
    });
});