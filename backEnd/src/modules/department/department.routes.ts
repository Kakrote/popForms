import { Router } from "express";
import {
  createDepartmentController,
  getAllDepartmentsController,
  getDepartmentController,
  updateDepartmentController,
  deleteDepartmentController,
  getDepartmentByUserController,
  getCurrentUserDepartmentController,
} from "./department.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";

const router = Router();

// Create department - ADMIN only
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  createDepartmentController
);

// Get all departments - ADMIN only
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  getAllDepartmentsController
);

// Get current user's department - USER and ADMIN
router.get(
  "/me",
  authenticate,
  authorizeRoles("USER", "ADMIN"),
  getCurrentUserDepartmentController
);

// Get department by ID - ADMIN only
router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  getDepartmentController
);

// Get department by user ID - ADMIN only
router.get(
  "/user/:userId",
  authenticate,
  authorizeRoles("ADMIN"),
  getDepartmentByUserController
);

// Update department - ADMIN only
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  updateDepartmentController
);

// Delete department - ADMIN only
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  deleteDepartmentController
);

export default router;
