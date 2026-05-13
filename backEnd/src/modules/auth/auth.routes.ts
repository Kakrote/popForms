import { Router } from "express";
import {
  loginController,
  registerController,
} from "./auth.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";

const router = Router();

router.post("/register", authenticate, authorizeRoles("ADMIN"), registerController);
router.post("/login", loginController);

export default router;