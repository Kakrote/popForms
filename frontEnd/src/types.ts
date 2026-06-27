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
  formAccess?: Array<{
    id: string;
    formId: string;
    departmentId: string;
    form: Form;
  }>;
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
  sectionId?: string;
  section?: FormSection;
};

export type FormSection = {
  id: string;
  formId: string;
  headerLabel?: string | null;
  headerDescription?: string | null;
  title: string;
  description?: string | null;
  sortOrder: number;
  fields: FormField[];
};

export type SubmissionValue = {
  id: string;
  fieldId: string;
  value: string;
  field?: FormField;
};

export type SubmissionEditHistory = {
  id: string;
  submissionId: string;
  editedById: string;
  editedBy?: User;
  changedValues: string;
  editedAt: string;
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
  editHistories?: SubmissionEditHistory[];
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
  sections: FormSection[];
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

export type FormBuilderSection = {
  headerLabel?: string;
  headerDescription?: string;
  title: string;
  description: string;
  fields: FormBuilderField[];
};

export type FormBuilderValues = {
  title: string;
  description: string;
  deadline: string;
  isOpen: boolean;
  sections: FormBuilderSection[];
};
