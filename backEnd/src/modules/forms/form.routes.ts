import { Router } from "express";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";
import { createForm, deleteForm, toggleFormStatus, listForms, getFormBySlug } from "./form.controller.js";

const router = Router();

router.get("/", authenticate, authorizeRoles("ADMIN"), listForms);
router.get("/:slug", authenticate, authorizeRoles("ADMIN", "USER"), getFormBySlug);
router.post("/", authenticate, authorizeRoles("ADMIN"), createForm);
router.delete("/:slug", authenticate, authorizeRoles("ADMIN"), deleteForm);
router.patch("/:slug", authenticate, authorizeRoles("ADMIN"), toggleFormStatus);
export default router;
