import { AppError } from "../../utils/appError.js";
import logger from "../../utils/logger.js";
import { createForm as createFormRepository, findFormByTitle, deleteForm as formDeleteRepo } from "./form.repository.js";
import { CreateFormInput } from "./form.types.js";

export const createForm = async (data: CreateFormInput, createdById: string) => {
    const form = await findFormByTitle(data.title);
    if (form) {
        logger.warn("The form title already exists. Rename the title.");
        throw new AppError("The form already exists", 409);
    }
	return await createFormRepository(data, createdById);
};


// deleting the form

export const deleteForm = async (slug:string)=>{
    const form = await findFormByTitle(slug)
    if(!form){
        logger.warn("The form title does not exist.");
        throw new AppError("The form does not exist", 404);
    }
    return await formDeleteRepo(slug);
}