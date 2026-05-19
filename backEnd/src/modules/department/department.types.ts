import { Prisma } from "@prisma/client";

export type Department = Partial<Prisma.DepartmentCreateInput>;

export interface CreateDepartmentInput {
  department_Name: string;
  userId: string;
}

export interface UpdateDepartmentInput {
  department_Name?: string;
  userId?: string;
}

export interface DepartmentWithUser {
  id: string;
  department_Name: string;
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}
