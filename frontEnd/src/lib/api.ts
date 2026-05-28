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

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

export const authApi = {
  login: async (payload: LoginFormValues) => {
    const response = await apiClient.post<ApiResponse<AuthPayload>>("/auth/login", payload);
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
    const response = await apiClient.post<ApiResponse<Form>>("/forms", {
      title: payload.title,
      description: payload.description || undefined,
      deadline: payload.deadline || undefined,
      isOpen: payload.isOpen,
      fields: payload.fields.map((field) => ({
        label: field.label,
        type: field.type,
        required: field.required,
        options: field.optionsText
          .split(",")
          .map((option) => option.trim())
          .filter(Boolean),
      })),
    });
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
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Submission>>(`/submissions/${id}`);
    return unwrap(response);
  },
  create: async (payload: { formId: string; departmentId: string; values: Array<{ fieldId: string; value: string }> }) => {
    const response = await apiClient.post<ApiResponse<Submission> | { status: string; data: Submission }>("/submissions", payload);
    return unwrap(response);
  },
};

export const departmentApi = {
  current: async () => {
    const response = await apiClient.get<ApiResponse<Department>>("/department/me");
    return unwrap(response);
  },
};

export const usersApi = {
  list: async () => {
    const response = await apiClient.get<ApiResponse<User[]>>("/user/users");
    return unwrap(response);
  },
};
