import { z } from "zod";

const formFieldSchema = z.object({
	name: z.string().min(1, "Field name is required"),
	label: z.string().min(1, "Field label is required"),
	type: z.enum(["text", "number", "date", "select", "radio", "checkbox", "textarea"]),
	required: z.boolean().optional(),
	options: z.array(z.string()).optional(),
});

export const createFormSchema = z.object({
	title: z.string().min(1, "Form title is required"),
	description: z.string().optional(),
	departmentId: z.string().min(1, "Department ID is required"),
	fields: z.array(formFieldSchema).optional(),
	isActive: z.boolean().optional(),
	createdBy: z.string().optional(),
});

export const updateFormSchema = z.object({
	id: z.string().min(1, "Form ID is required"),
	title: z.string().min(1).optional(),
	description: z.string().optional(),
	departmentId: z.string().min(1).optional(),
	fields: z.array(formFieldSchema).optional(),
	isActive: z.boolean().optional(),
});

export const getFormSchema = z.object({
	id: z.string().min(1, "Form ID is required"),
});

export const deleteFormSchema = z.object({
	id: z.string().min(1, "Form ID is required"),
});

export const listFormsSchema = z.object({
	departmentId: z.string().optional(),
	isActive: z.boolean().optional(),
});