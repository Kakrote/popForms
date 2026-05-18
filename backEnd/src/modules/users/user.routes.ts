import { Router } from "express";
import {getuserByID, getUsers} from "./user.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";

const router=Router();

router.get("/users",authenticate,authorizeRoles('ADMIN'),getUsers);
router.get("/:id",authenticate,authorizeRoles('ADMIN',),getuserByID)

export default router;