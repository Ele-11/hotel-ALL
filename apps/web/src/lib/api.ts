import axios, { AxiosError } from "axios";
import type {
  ApiResponse,
  CurrentUser,
  LoginResponse,
  Role,
} from "../types/auth";
import type { AdminHotel, AuditHotelListParams } from "../types/admin";
import type {
  PublicHotelDetail,
  PublicHotelListResponse,
  PublicRoomType,
  HotelListQuery,
} from "../types/hotel";
import type {
  MerchantHotel,
  MerchantHotelInput,
  MerchantRoom,
  MerchantRoomInput,
} from "../types/merchant";

export const TOKEN_STORAGE_KEY = "hotel_auth_token";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
});

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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

export async function getPublicHotels(params: HotelListQuery = {}) {
  const response = await apiClient.get<ApiResponse<PublicHotelListResponse>>(
    "/hotels",
    {
      params: sanitizeQueryParams(params),
    },
  );
  return response.data.data;
}

export async function getPublicHotelDetail(
  hotelId: number,
  params: Pick<HotelListQuery, "checkInDate" | "checkOutDate"> = {},
) {
  const response = await apiClient.get<ApiResponse<PublicHotelDetail>>(
    `/hotels/${hotelId}`,
    {
      params: sanitizeQueryParams(params),
    },
  );
  return response.data.data;
}

export async function getPublicHotelRooms(hotelId: number) {
  const response = await apiClient.get<ApiResponse<PublicRoomType[]>>(
    `/hotels/${hotelId}/rooms`,
  );
  return response.data.data;
}

export async function getMerchantHotels() {
  const response =
    await apiClient.get<ApiResponse<MerchantHotel[]>>("/hotels/my");
  return response.data.data;
}

export async function createMerchantHotel(input: MerchantHotelInput) {
  const response = await apiClient.post<ApiResponse<MerchantHotel>>(
    "/hotels",
    input,
  );
  return response.data.data;
}

export async function updateMerchantHotel(
  hotelId: number,
  input: MerchantHotelInput,
) {
  const response = await apiClient.patch<ApiResponse<MerchantHotel>>(
    `/hotels/${hotelId}`,
    input,
  );
  return response.data.data;
}

export async function createMerchantRoom(input: MerchantRoomInput) {
  const response = await apiClient.post<ApiResponse<MerchantRoom>>(
    "/rooms",
    input,
  );
  return response.data.data;
}

export async function updateMerchantRoom(
  roomId: number,
  input: MerchantRoomInput,
) {
  const response = await apiClient.patch<ApiResponse<MerchantRoom>>(
    `/rooms/${roomId}`,
    input,
  );
  return response.data.data;
}

export async function getAuditHotels(params: AuditHotelListParams = {}) {
  const response = await apiClient.get<ApiResponse<AdminHotel[]>>(
    "/audit/hotels",
    {
      params:
        params.status && params.status !== "ALL"
          ? { status: params.status }
          : undefined,
    },
  );
  return response.data.data;
}

export async function approveAuditHotel(hotelId: number) {
  const response = await apiClient.patch<ApiResponse<AdminHotel>>(
    `/audit/hotels/${hotelId}/approve`,
  );
  return response.data.data;
}

export async function rejectAuditHotel(hotelId: number, reason: string) {
  const response = await apiClient.patch<ApiResponse<AdminHotel>>(
    `/audit/hotels/${hotelId}/reject`,
    { reason },
  );
  return response.data.data;
}

export async function publishAuditHotel(hotelId: number) {
  const response = await apiClient.patch<ApiResponse<AdminHotel>>(
    `/audit/hotels/${hotelId}/publish`,
  );
  return response.data.data;
}

export async function offlineAuditHotel(hotelId: number) {
  const response = await apiClient.patch<ApiResponse<AdminHotel>>(
    `/audit/hotels/${hotelId}/offline`,
  );
  return response.data.data;
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as
      | { message?: string }
      | undefined;
    return responseData?.message ?? "请求失败，请稍后重试";
  }

  return "请求失败，请稍后重试";
}

function sanitizeQueryParams(
  params: Record<string, string | number | null | undefined>,
) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }

      if (typeof value === "string") {
        return value.trim().length > 0;
      }

      return true;
    }),
  );
}