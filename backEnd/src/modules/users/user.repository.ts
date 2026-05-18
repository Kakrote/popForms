// import { string } from "zod";

import { prisma } from "../../lib/prisma.js";

export const getUsersFromDB = async () => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            profile: true
        }
    })

    return users
}

export const getUser = async (id:string)=>{
    const user=await prisma.user.findUnique({
        where:{
            id:id
        },
        select:{
            id:true,
            username:true,
            email:true,
            role:true,
            profile:true
        }
    })
    return user
}