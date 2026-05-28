import { Router } from "express";
import { submitFormHandler, getAllSubmissionsHandler, getSubmissionByIdHandler, getCurrentUserSubmissionsHandler, getCurrentUserSubmissionByFormHandler, getCurrentUserDraftsHandler, deleteSubmissionHandler } from "./submission.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";

const router = Router();

router.get("/", authenticate, authorizeRoles("ADMIN"), getAllSubmissionsHandler);
router.get("/me", authenticate, authorizeRoles("USER", "ADMIN"), getCurrentUserSubmissionsHandler);
router.get("/me/drafts", authenticate, authorizeRoles("USER", "ADMIN"), getCurrentUserDraftsHandler);
router.get("/form/:formId/me", authenticate, authorizeRoles("USER", "ADMIN"), getCurrentUserSubmissionByFormHandler);
router.get("/:id", authenticate, authorizeRoles("ADMIN"), getSubmissionByIdHandler);
router.delete("/:id", authenticate, authorizeRoles("USER", "ADMIN"), deleteSubmissionHandler);
router.post("/",authenticate,authorizeRoles("USER", "ADMIN"), submitFormHandler);

export default router;