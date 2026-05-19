import {prisma} from "../../lib/prisma.js";
import { FormCreateInput, FormField } from "./form.types.js";

export const createForm = async (data: FormCreateInput) => {
    return await prisma.
}