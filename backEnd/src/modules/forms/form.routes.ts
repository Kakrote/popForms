import { Router } from "express";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";
import { createForm, deleteForm, toggleFormStatus } from "./form.controller.js";

const router = Router();

router.post("/", authenticate, authorizeRoles("ADMIN"), createForm);
router.delete("/:slug", authenticate, authorizeRoles("ADMIN"), deleteForm);
router.patch("/:slug", authenticate, authorizeRoles("ADMIN"), toggleFormStatus);
export default router;
