import { Router } from "express";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";
import { createForm, deleteForm } from "./form.controller.js";

const router = Router();

router.post("/", authenticate, authorizeRoles("ADMIN"), createForm);
router.delete("/:slug", authenticate, authorizeRoles("ADMIN"), deleteForm);
export default router;
