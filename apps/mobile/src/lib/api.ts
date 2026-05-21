import axios, { AxiosError } from "axios";
import type {
  HotelListQuery,
  PublicHotelDetail,
  PublicHotelListResponse,
} from "../types/hotel";

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
});

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
