import { Prisma } from "@prisma/client";

export type Submission = Partial<Prisma.SubmissionCreateInput>;

export type SubmissionStatus = "DRAFT" | "SUBMITTED";

export interface SubmissionValueInput {
    fieldId: string;
    value: string;
}

export interface CreateSubmissionInput {
    formId: string;
    departmentId: string;
    submittedById: string;
    values?: SubmissionValueInput[];
    status?: SubmissionStatus;
    isLocked?: boolean;
    submittedAt?: string | Date;
}

export interface UpdateSubmissionInput {
    id: string;
    values?: SubmissionValueInput[];
    status?: SubmissionStatus;
    isLocked?: boolean;
    submittedAt?: string | Date | null;
}

export interface GetSubmissionInput {
    id: string;
}

export interface ListSubmissionsInput {
    formId?: string;
    departmentId?: string;
    submittedById?: string;
    status?: SubmissionStatus;
    isLocked?: boolean;
}
