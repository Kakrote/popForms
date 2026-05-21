import { Router } from "express";
import { submitFormHandler } from "./submission.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";

const router = Router();

router.post("/",authenticate,authorizeRoles("USER", "ADMIN"), submitFormHandler);

export default router;