import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  createNewDepartment,
  getDepartment,
  getAllDepartmentsService,
  updateDepartmentService,
  deleteDepartmentService,
  getDepartmentByUserService,
  getCurrentUserDepartmentService,
} from "./department.service.js";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  getDepartmentSchema,
} from "./department.validation.js";

// Create a new department
export const createDepartmentController = catchAsync(
  async (req: Request, res: Response) => {
    const payload = createDepartmentSchema.parse(req.body);
    const department = await createNewDepartment(payload);

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  }
);

// Get all departments
export const getAllDepartmentsController = catchAsync(
  async (_req: Request, res: Response) => {
    const departments = await getAllDepartmentsService();

    res.status(200).json({
      success: true,
      message: "Departments retrieved successfully",
      data: departments,
    });
  }
);

// Get department by ID
export const getDepartmentController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = getDepartmentSchema.parse(req.params);
    const department = await getDepartment(id);

    res.status(200).json({
      success: true,
      message: "Department retrieved successfully",
      data: department,
    });
  }
);

// Update department
export const updateDepartmentController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = getDepartmentSchema.parse(req.params);
    const payload = updateDepartmentSchema.parse(req.body);
    const department = await updateDepartmentService(id, payload);

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  }
);

// Delete department
export const deleteDepartmentController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = getDepartmentSchema.parse(req.params);
    await deleteDepartmentService(id);

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  }
);

// Get department by user ID
export const getDepartmentByUserController = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const department = await getDepartmentByUserService(userId);

    res.status(200).json({
      success: true,
      message: "Department retrieved successfully for user",
      data: department,
    });
  }
);

export const getCurrentUserDepartmentController = catchAsync(
  async (req: Request & { user?: { id: string } }, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const department = await getCurrentUserDepartmentService(userId);

    res.status(200).json({
      success: true,
      message: "Department retrieved successfully for current user",
      data: department,
    });
  }
);
