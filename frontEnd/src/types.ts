export type Role = "ADMIN" | "USER";

export type ApiResponse<T> = {
  success?: boolean;
  status?: string;
  message?: string;
  data: T;
};

export type User = {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthPayload = {
  token: string;
  user: User;
};

export type Department = {
  id: string;
  department_Name: string;
  userId: string;
  user?: User;
};

export type FieldOption = {
  id: string;
  label: string;
  value: string;
};

export type FieldType = "TEXT" | "TEXTAREA" | "NUMBER" | "EMAIL" | "DATE" | "SELECT" | "RADIO" | "CHECKBOX";

export type FormField = {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: FieldType;
  placeholder?: string | null;
  required: boolean;
  sortOrder: number;
  options: FieldOption[];
};

export type SubmissionValue = {
  id: string;
  fieldId: string;
  value: string;
  field?: FormField;
};

export type Submission = {
  id: string;
  formId: string;
  departmentId: string;
  submittedById: string;
  status: "DRAFT" | "SUBMITTED";
  isLocked: boolean;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  form?: Form;
  department?: Department;
  submittedBy?: User;
  submissionValue: SubmissionValue[];
};

export type Form = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  isOpen: boolean;
  deadline?: string | null;
  createdById: string;
  createdBy?: User;
  fields: FormField[];
  submissions: Array<Pick<Submission, "id">> | Submission[];
  createdAt: string;
  updatedAt: string;
};

export type LoginFormValues = {
  email: string;
  password: string;
};

export type FormBuilderField = {
  label: string;
  type: "text" | "textarea" | "number" | "email" | "date" | "select" | "radio" | "checkbox";
  required: boolean;
  optionsText: string;
};

export type FormBuilderValues = {
  title: string;
  description: string;
  deadline: string;
  isOpen: boolean;
  fields: FormBuilderField[];
};
