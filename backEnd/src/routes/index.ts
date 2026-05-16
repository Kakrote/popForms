import { Router,Request,Response } from "express";
import authRotues from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";

const router=Router();


// This is the api health route to check if the api is working fine or not 
router.get("/",(req:Request,res:Response)=>{
    res.send("Hello the api route is working fine");
})

router.use("/auth",authRotues);
router.use("/user",userRoutes)


export default router;