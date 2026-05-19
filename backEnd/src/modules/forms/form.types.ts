enum  Filds{
    TEXT,
    TEXTAREA,
    NUMBER,
    EMAIL,
    DATE,
    SELECT,
    RADIO,
    CHECKBOX,
    FILE,
}

export type FormField = {
    label: string;
    type: Filds;
    required?: boolean;
    options?: string[];
}

export type FormCreateInput = {
    title: string;
    slug: string;
    description?: string;
    departmentId: string;
    fields?: FormField[];
    isActive?: boolean;
    createdBy?: string;
}

