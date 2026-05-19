import { z } from "zod";

export const createDepartmentSchema = z.object({
  department_Name: z.string().min(1, "Department name is required"),
  userId: z.string().min(1, "User ID is required"),
});

export const updateDepartmentSchema = z.object({
  department_Name: z.string().min(1, "Department name is required").optional(),
  userId: z.string().min(1, "User ID is required").optional(),
});

export const getDepartmentSchema = z.object({
  id: z.string().min(1, "Department ID is required"),
});
