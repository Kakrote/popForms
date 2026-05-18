import { AppError } from "../../utils/appError.js";
import { getUsersFromDB, getUser } from "./user.repository.js";
import {User} from "./user.types.js"

type UsersArray = Awaited<ReturnType<typeof getUsersFromDB>>;
type UserRecord = UsersArray extends Array<infer U> ? U : never;
type SafeUser = Omit<UserRecord, "password">;

const sanitizeUser = (user: UserRecord | SafeUser | null | undefined): SafeUser => {
    if (!user) {
        throw new AppError("User not found", 404);
    }

    // const { password, ...rest } = user as any;
    // return rest as SafeUser;
    const safeUser= {...user} as SafeUser & {password?:null};
    delete safeUser.password;
    return safeUser
}

export const getAllUsers = async () => {
    const users = await getUsersFromDB();
    return users.map((u) => sanitizeUser(u));
}


// fetch single user by user id

export const getUserById=async (id:User["id"])=>{
    const user =await getUser(id);
    return sanitizeUser(user);
}