export type FormField = {
    label: string;
    type: "text" | "textarea" | "number" | "email" | "date" | "select" | "radio" | "checkbox";
    required?: boolean;
    options?: string[];
};

export type FormSection = {
    headerLabel?: string;
    headerDescription?: string;
    title: string;
    description?: string;
    fields?: FormField[];
};

export type CreateFormInput = {
    title: string;
    description?: string;
    sections?: FormSection[];
    isOpen?: boolean;
    deadline?: string | Date;
    departmentIds?: string[];
};

export type UpdateFormInput = Partial<CreateFormInput>;

