import { Router } from "express";
import { authenticate, authorizeRoles, optionalAuthenticate } from "../../middlewares/auth.middlewares.js";
import { createForm, deleteForm, updateForm, toggleFormStatus, listForms, getFormBySlug } from "./form.controller.js";

const router = Router();

router.get("/", authenticate, authorizeRoles("ADMIN", "USER"), listForms);
router.get("/:slug", optionalAuthenticate, getFormBySlug);
router.post("/", authenticate, authorizeRoles("ADMIN"), createForm);
router.delete("/:slug", authenticate, authorizeRoles("ADMIN"), deleteForm);
router.put("/:slug", authenticate, authorizeRoles("ADMIN"), updateForm);
router.patch("/:slug", authenticate, authorizeRoles("ADMIN"), toggleFormStatus);
export default router;
