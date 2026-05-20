import { Router } from "express";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";
import { createForm } from "./form.controller.js";

const router = Router();

router.post("/", authenticate, authorizeRoles("ADMIN"), createForm);

export default router;
