import { Router,Request,Response } from "express";

const router=Router();


// This is the api health route to check if the api is working fine or not 
router.get("/",(req:Request,res:Response)=>{
    res.send("Hello the api route is working fine");
})

export default router;