import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { getAllUsers,getUserById } from "./user.service.js";
import { success } from "zod";

export const getUsers = catchAsync(async (_req: Request, res: Response) => {
    const users = await getAllUsers();
    res.status(200).json({
        success: true,
        data: users,
    });
});


// geting the single user from the id;

export const getuserByID = catchAsync(
    async (req:Request,res:Response)=>{
        const id= req.params.id as string;
        const result = await getUserById(id);
        res.status(200).json({
            success:true,
            data:result,
        });
    }
)