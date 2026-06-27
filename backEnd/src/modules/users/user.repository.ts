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
        const department = await tx.department.findUnique({
            where: { userId: id }
        });

        if (department) {
            await tx.submission.deleteMany({
                where: { departmentId: department.id }
            });
        }

        await tx.submission.deleteMany({
            where: { submittedById: id }
        });

        const userForms = await tx.form.findMany({
            where: { createdById: id },
            select: { id: true }
        });
        const formIds = userForms.map(f => f.id);

        if (formIds.length > 0) {
            await tx.submission.deleteMany({
                where: { formId: { in: formIds } }
            });
            await tx.form.deleteMany({
                where: { id: { in: formIds } }
            });
        }

        await tx.submissionEditHistory.deleteMany({
            where: { editedById: id }
        });

        await tx.profile.deleteMany({
            where: { userId: id }
        });

        await tx.department.deleteMany({
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