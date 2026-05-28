import {
  createDepartment,
  getDepartmentById,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
  getDepartmentByUserId,
} from "./department.repository.js";
import { CreateDepartmentInput, UpdateDepartmentInput } from "./department.types.js";
import { AppError } from "../../utils/appError.js";
import { prisma } from "../../lib/prisma.js";

// Create a new department
export const createNewDepartment = async (data: CreateDepartmentInput) => {
  // Check if department name already exists
  const existingDepartment = await prisma.department.findUnique({
    where: { department_Name: data.department_Name },
  });

  if (existingDepartment) {
    throw new AppError("Department already exists", 409);
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Check if user already has a department
  const userDepartment = await getDepartmentByUserId(data.userId);
  if (userDepartment) {
    throw new AppError("User already has a department assigned", 409);
  }

  return await createDepartment(data);
};

// Get department by ID
export const getDepartment = async (id: string) => {
  const department = await getDepartmentById(id);

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  return department;
};

// Get all departments
export const getAllDepartmentsService = async () => {
  return await getAllDepartments();
};

// Update department
export const updateDepartmentService = async (
  id: string,
  data: UpdateDepartmentInput
) => {
  // Check if department exists
  const department = await getDepartmentById(id);
  if (!department) {
    throw new AppError("Department not found", 404);
  }

  // If updating department name, check if it already exists
  if (data.department_Name) {
    const existingDepartment = await prisma.department.findUnique({
      where: { department_Name: data.department_Name },
    });

    if (
      existingDepartment &&
      existingDepartment.id !== id
    ) {
      throw new AppError("Department name already exists", 409);
    }
  }

  // If updating userId, check if user exists
  if (data.userId) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if user already has a department
    const userDepartment = await getDepartmentByUserId(data.userId);
    if (userDepartment && userDepartment.id !== id) {
      throw new AppError("User already has a department assigned", 409);
    }
  }

  return await updateDepartment(id, data);
};

// Delete department
export const deleteDepartmentService = async (id: string) => {
  const department = await getDepartmentById(id);
  if (!department) {
    throw new AppError("Department not found", 404);
  }

  return await deleteDepartment(id);
};

// Get department by user ID
export const getDepartmentByUserService = async (userId: string) => {
  const department = await getDepartmentByUserId(userId);

  if (!department) {
    throw new AppError("Department not found for this user", 404);
  }

  return department;
};

export const getCurrentUserDepartmentService = async (userId: string) => {
  const department = await getDepartmentByUserId(userId);

  if (!department) {
    throw new AppError("Department not found for this user", 404);
  }

  return department;
};
