import { apiClient } from "./client";
import type {
  ApiResponse,
  CurrentUser,
  LoginResponse,
  Role,
} from "../types/auth";

export async function registerAccount(input: {
  username: string;
  password: string;
  role: Exclude<Role, "ADMIN">;
}) {
  const response = await apiClient.post<ApiResponse<CurrentUser>>(
    "/auth/register",
    input,
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
