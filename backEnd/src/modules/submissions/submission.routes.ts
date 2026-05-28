import { Router } from "express";
import { submitFormHandler, getAllSubmissionsHandler, getSubmissionByIdHandler } from "./submission.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";

const router = Router();

router.get("/", authenticate, authorizeRoles("ADMIN"), getAllSubmissionsHandler);
router.get("/:id", authenticate, authorizeRoles("ADMIN"), getSubmissionByIdHandler);
router.post("/",authenticate,authorizeRoles("USER", "ADMIN"), submitFormHandler);

export default router;