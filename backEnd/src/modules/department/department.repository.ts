import { prisma } from "../../lib/prisma.js";
import { CreateDepartmentInput, UpdateDepartmentInput } from "./department.types.js";

export const createDepartment = async (data: CreateDepartmentInput) => {
    return await prisma.department.create({
        data: {
            department_Name: data.department_Name,
            userId: data.userId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
};

export const getDepartmentById = async (id: string) => {
    return await prisma.department.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
};

export const getAllDepartments = async () => {
    return await prisma.department.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
};

export const updateDepartment = async (
    id: string,
    data: UpdateDepartmentInput
) => {
    return await prisma.department.update({
        where: { id },
        data: {
            ...(data.department_Name && { department_Name: data.department_Name }),
            ...(data.userId && { userId: data.userId }),
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
};

export const deleteDepartment = async (id: string) => {
    return await prisma.department.delete({
        where: { id },
    });
};

export const getDepartmentByUserId = async (userId: string) => {
    return await prisma.department.findUnique({
        where: { userId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
};
