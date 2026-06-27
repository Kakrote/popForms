import axios from "axios";
import { useAuthStore } from "../store/authStore";
import type {
  ApiResponse,
  AuthPayload,
  Department,
  Form,
  FormBuilderValues,
  LoginFormValues,
  Submission,
  User,
} from "../types";

const baseURL = import.meta.env.VITE_API_URL || "http://192.168.8.10:5000/api";

export const apiClient = axios.create({
  baseURL,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const unwrap = <T>(response: { data: ApiResponse<T> } | { data: { status?: string; data: T } }) => {
  return response.data.data;
};

const serializeFormBuilderPayload = (payload: FormBuilderValues) => {
  console.log("Serializing payload:", payload);
  const result = {
    title: payload.title,
    description: payload.description || undefined,
    deadline: payload.deadline || undefined,
    isOpen: payload.isOpen,
    sections: payload.sections.map((section) => ({
      headerLabel: section.headerLabel,
      headerDescription: section.headerDescription,
      title: section.title,
      description: section.description || undefined,
      fields: section.fields.map((field) => ({
        label: field.label,
        type: field.type,
        required: field.required,
        options:
          field.type === "select" || field.type === "radio" || field.type === "checkbox"
            ? field.optionsText
                .split(",")
                .map((option) => option.trim())
                .filter(Boolean)
            : undefined,
      })),
    })),
  };
  console.log("Serialized result:", result);
  return result;
};

export const authApi = {
  login: async (payload: LoginFormValues) => {
    const response = await apiClient.post<ApiResponse<AuthPayload>>("/auth/login", payload);
    return unwrap(response);
  },
  register: async (payload: { username: string; email: string; password: string; role?: "USER" | "ADMIN" }) => {
    const response = await apiClient.post<ApiResponse<User>>("/auth/register", payload);
    return unwrap(response);
  },
};

export const formsApi = {
  list: async () => {
    const response = await apiClient.get<ApiResponse<Form[]>>("/forms");
    return unwrap(response);
  },
  getBySlug: async (slug: string) => {
    const response = await apiClient.get<ApiResponse<Form>>(`/forms/${slug}`);
    return unwrap(response);
  },
  create: async (payload: FormBuilderValues) => {
    const response = await apiClient.post<ApiResponse<Form>>("/forms", serializeFormBuilderPayload(payload));
    return unwrap(response);
  },
  update: async (slug: string, payload: FormBuilderValues) => {
    const response = await apiClient.put<ApiResponse<Form>>(`/forms/${slug}`, serializeFormBuilderPayload(payload));
    return unwrap(response);
  },
  toggleStatus: async (slug: string, isOpen: boolean) => {
    const response = await apiClient.patch<ApiResponse<Form>>(`/forms/${slug}`, { isOpen });
    return unwrap(response);
  },
  remove: async (slug: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/forms/${slug}`);
    return unwrap(response);
  },
};

export const submissionsApi = {
  list: async () => {
    const response = await apiClient.get<ApiResponse<Submission[]>>("/submissions");
    return unwrap(response);
  },
  mine: async () => {
    const response = await apiClient.get<ApiResponse<Submission[]>>("/submissions/me");
    return unwrap(response);
  },
  mineDrafts: async () => {
    const response = await apiClient.get<ApiResponse<Submission[]>>("/submissions/me/drafts");
    return unwrap(response);
  },
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Submission>>(`/submissions/${id}`);
    return unwrap(response);
  },
  getMineByForm: async (formId: string) => {
    const response = await apiClient.get<ApiResponse<Submission | null>>(`/submissions/form/${formId}/me`);
    return unwrap(response);
  },
  create: async (payload: { formId: string; departmentId: string; values: Array<{ fieldId: string; value: string }> }) => {
    const response = await apiClient.post<ApiResponse<Submission> | { status: string; data: Submission }>("/submissions", {
      ...payload,
      status: "SUBMITTED",
    });
    return unwrap(response);
  },
  saveDraft: async (payload: { formId: string; departmentId: string; values: Array<{ fieldId: string; value: string }> }) => {
    const response = await apiClient.post<ApiResponse<Submission> | { status: string; data: Submission }>("/submissions", {
      ...payload,
      status: "DRAFT",
    });
    return unwrap(response);
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<Submission>>(`/submissions/${id}`);
    return unwrap(response);
  },
};

export const departmentApi = {
  list: async () => {
    const response = await apiClient.get<ApiResponse<Department[]>>("/department");
    return unwrap(response);
  },
  current: async () => {
    const response = await apiClient.get<ApiResponse<Department>>("/department/me");
    return unwrap(response);
  },
  getByUser: async (userId: string) => {
    const response = await apiClient.get<ApiResponse<Department>>(`/department/user/${userId}`);
    return unwrap(response);
  },
  create: async (payload: { department_Name: string; userId: string }) => {
    const response = await apiClient.post<ApiResponse<Department>>(`/department`, payload);
    return unwrap(response);
  },
  update: async (id: string, payload: { department_Name?: string; userId?: string }) => {
    const response = await apiClient.patch<ApiResponse<Department>>(`/department/${id}`, payload);
    return unwrap(response);
  },
  remove: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/department/${id}`);
    return unwrap(response);
  },
};

export const usersApi = {
  list: async () => {
    const response = await apiClient.get<ApiResponse<User[]>>("/user/users");
    return unwrap(response);
  },
  update: async (id: string, payload: Partial<Pick<User, "username" | "email" | "role">>) => {
    const response = await apiClient.patch<ApiResponse<User>>(`/user/${id}`, payload);
    return unwrap(response);
  },
  remove: async (id: string) => {
    const targetUrl = `${apiClient.defaults.baseURL || ""}/user/${id}`;
    alert(`Requesting DELETE: ${targetUrl}`);
    const response = await apiClient.delete<ApiResponse<User>>(`/user/${id}`);
    return unwrap(response);
  },
};
