import { AppError } from "../../utils/appError.js";
import logger from "../../utils/logger.js";
import {
    createForm as createFormRepository,
    findFormByTitle,
    deleteForm as formDeleteRepo,
    toggleFormStatus,
    updateForm as updateFormRepository,
    getAllForms,
    getFormBySlug,
} from "./form.repository.js";
import { CreateFormInput, UpdateFormInput } from "./form.types.js";

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
    const form = await getFormBySlug(slug)
    if(!form){
        logger.warn("The form title does not exist.");
        throw new AppError("The form does not exist", 404);
    }
    return await formDeleteRepo(slug);
}

// activeating and deactivating the form 
export const toggleFormStatusService = async (title:string,isOpen:boolean)=>{
    const form = await getFormBySlug(title);
    if(!form){
        logger.warn("The form does not exist.");
        throw new AppError("The form does not exist", 404);
    }
    logger.info(`Toggling form status for ${form.slug} to ${isOpen ? "open" : "closed"}`);
    return await toggleFormStatus(form.slug, isOpen);
}

export const updateFormService = async (slug: string, data: UpdateFormInput) => {
    const form = await getFormBySlug(slug);

    if (!form) {
        logger.warn("The form does not exist.");
        throw new AppError("The form does not exist", 404);
    }

    return await updateFormRepository(slug, data);
};

export const listFormsService = async () => {
    return await getAllForms();
};

export const getFormBySlugService = async (slug: string) => {
    const form = await getFormBySlug(slug);

    if (!form) {
        throw new AppError("Form does not exist", 404);
    }

    return form;
};