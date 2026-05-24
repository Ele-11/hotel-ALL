import { apiClient } from "./client";
import type { AdminHotel, AuditHotelListParams } from "../types/admin";
import type { ApiResponse } from "../types/auth";

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
