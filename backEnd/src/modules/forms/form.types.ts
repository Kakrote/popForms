export type FormField = {
    label: string;
    type: "text" | "textarea" | "number" | "email" | "date" | "select" | "radio" | "checkbox";
    required?: boolean;
    options?: string[];
};

export type CreateFormInput = {
    title: string;
    description?: string;
    fields?: FormField[];
    isOpen?: boolean;
    deadline?: string | Date;
};

