import axios, { AxiosError } from "axios";
import type {
  ApiResponse,
  CurrentUser,
  LoginResponse,
} from "../types/auth";
import type { BookingRecord, CreateBookingInput } from "../types/booking";
import type {
  HotelListQuery,
  PublicHotelDetail,
  PublicHotelListResponse,
} from "../types/hotel";

export const TOKEN_STORAGE_KEY = "hotel_auth_token";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
});

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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

export async function createBooking(input: CreateBookingInput) {
  const response = await apiClient.post<ApiResponse<BookingRecord>>(
    "/bookings",
    input,
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

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
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
