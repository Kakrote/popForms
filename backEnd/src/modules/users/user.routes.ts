import { Router } from "express";
import {getuserByID, getUsers, updateUserProfileController} from "./user.controller.js";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middlewares.js";

const router=Router();

router.get("/users",authenticate,authorizeRoles('ADMIN'),getUsers);
router.get("/:id",authenticate,authorizeRoles('ADMIN',),getuserByID);
router.patch("/:id",authenticate,authorizeRoles('ADMIN'),updateUserProfileController);

export default router;