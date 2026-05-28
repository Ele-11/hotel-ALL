import { apiClient } from "./client";
import { TOKEN_STORAGE_KEY } from "../config/app";
import type {
  ApiResponse,
  CurrentUser,
  LoginResponse,
} from "../types/auth";

export async function registerUserAccount(input: {
  username: string;
  password: string;
}) {
  const response = await apiClient.post<ApiResponse<CurrentUser>>(
    "/auth/register",
    {
      ...input,
      role: "USER",
    },
  );
  return response.data.data;
}

export async function loginAccount(input: {
  username: string;
  password: string;
}) {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    "/auth/login",
    input,
  );
  return response.data.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get<ApiResponse<CurrentUser>>("/auth/me");
  return response.data.data;
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}
