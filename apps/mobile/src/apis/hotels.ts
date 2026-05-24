import { apiClient } from "./client";
import { sanitizeQueryParams } from "../utils/query";
import type { ApiResponse } from "../types/auth";
import type {
  HotelListQuery,
  PublicHotelDetail,
  PublicHotelListResponse,
} from "../types/hotel";

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
