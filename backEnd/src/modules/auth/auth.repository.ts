import {prisma} from "../../lib/prisma.js";
import { RegisterInput } from "./auth.types.js";

export const findUserByEmail=async(email:string)=>{
    return await prisma.user.findUnique({
        where:{email:email},
        select: {
            id: true,
            email: true,
            username: true,
            role: true,
            password: true,
            createdAt: true,
            updatedAt: true,
        }
    })
}

export const createUser=async(
    data:RegisterInput
)=>{
    return await prisma.user.create({
        data:{
            username:data.username,
            email:data.email,
            password:data.password,
            role:data.role || "USER"
        }
    })
}




