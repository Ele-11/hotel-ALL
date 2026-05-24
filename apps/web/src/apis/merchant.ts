import { apiClient } from "./client";
import type { ApiResponse } from "../types/auth";
import type {
  MerchantHotel,
  MerchantHotelInput,
  MerchantRoom,
  MerchantRoomInput,
} from "../types/merchant";

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
