// import { string } from "zod";

import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { User } from "./user.types.js";

export const getUsersFromDB = async () => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            profile: true
        }
    })

    return users
}

export const getUser = async (id:User["id"])=>{
    const user=await prisma.user.findUnique({
        where:{
            id:id
        },
        select:{
            id:true,
            username:true,
            email:true,
            role:true,
            profile:true
        }
    })
    return user
}

// update user profile

type UpdateData = Partial<Prisma.UserCreateInput>;

export const updateUser = async (id: User["id"], data: UpdateData) => {
    const updatedUser = await prisma.user.update({
        where: { id: id },
        data,
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            profile: true,
        },
    })

    return updatedUser
}

export const deleteUser = async (id: User["id"]) => {
    return await prisma.$transaction(async (tx) => {
        await tx.profile.deleteMany({
            where: { userId: id }
        });

        return await tx.user.delete({
            where: { id: id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                profile: true
            }
        });
    });
}