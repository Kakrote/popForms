// import { string } from "zod";
import {prisma} from "../../lib/prisma.js";

export const getUsersFromDB = async()=>{
    const users=await prisma.user.findMany({
        select:{
            username: true,
            email: true,
            role: true,
            profile: true
        }
    })

    return users
}