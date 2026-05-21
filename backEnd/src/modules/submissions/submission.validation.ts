import { z } from "zod";

const submissionValueSchema = z.object({
	fieldId: z.string().min(1, "Field ID is required"),
	value: z.string(),
});

export const createSubmissionSchema = z.object({
	formId: z.string().min(1, "Form ID is required"),
	departmentId: z.string().min(1, "Department ID is required"),
	values: z.array(submissionValueSchema).optional(),
	status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
	submittedAt: z.coerce.date().optional(),
});

export const updateSubmissionSchema = z.object({
	id: z.string().min(1, "Submission ID is required"),
	values: z.array(submissionValueSchema).optional(),
	status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
	isLocked: z.boolean().optional(),
	submittedAt: z.coerce.date().nullable().optional(),
});

export const getSubmissionSchema = z.object({
	id: z.string().min(1, "Submission ID is required"),
});

export const deleteSubmissionSchema = z.object({
	id: z.string().min(1, "Submission ID is required"),
});

export const listSubmissionsSchema = z.object({
	formId: z.string().min(1).optional(),
	departmentId: z.string().min(1).optional(),
	submittedById: z.string().min(1).optional(),
	status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
	isLocked: z.boolean().optional(),
});
