import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { getAllUsers,getUserById, updateUserProfile, removeUser } from "./user.service.js";
import { success } from "zod";
import { User } from "./user.types.js";
import { hashPassword } from "../../utils/hashPassword.js";

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

// update user profile
export const updateUserProfileController = catchAsync(
    async (req:Request,res:Response)=>{
        const id= req.params.id as string;
        const updateData = req.body as Partial<User>;
        if (updateData.password) {
            // Hash the password before updating
            updateData.password = await hashPassword(updateData.password);
        }
        const result = await updateUserProfile(id,updateData);
        res.status(200).json({
            success:true,
            data:result,
        });
    }
)

// delete user controller
export const deleteUserController = catchAsync(
    async (req:Request,res:Response)=>{
        const id = req.params.id as string;
        const result = await removeUser(id);
        res.status(200).json({
            success:true,
            data:result,
        });
    }
)