import { z } from "zod";

const formFieldSchema = z.object({
	label: z.string().min(1, "Field label is required"),
	type: z.enum(["text", "number", "date", "select", "radio", "checkbox", "textarea", "email"]),
	required: z.boolean().optional(),
	options: z.array(z.string()).optional(),
});

export const createFormSchema = z.object({
	title: z.string().min(1, "Form title is required"),
	description: z.string().optional(),
	fields: z.array(formFieldSchema).optional(),
	isOpen: z.boolean().optional(),
	deadline: z.coerce.date().optional(),
});

export const updateFormSchema = z.object({
	id: z.string().min(1, "Form ID is required"),
	title: z.string().min(1).optional(),
	description: z.string().optional(),
	fields: z.array(formFieldSchema).optional(),
	isOpen: z.boolean().optional(),
	deadline: z.coerce.date().optional(),
});

export const getFormSchema = z.object({
	id: z.string().min(1, "Form ID is required"),
});

export const deleteFormSchema = z.object({
	id: z.string().min(1, "Form ID is required"),
});

export const listFormsSchema = z.object({
	isOpen: z.boolean().optional(),
});