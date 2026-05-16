import { Router } from "express";
import {getUsers} from "./user.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";

const router=Router();

router.get("/users",authenticate,authorizeRoles('ADMIN'),getUsers);

export default router;