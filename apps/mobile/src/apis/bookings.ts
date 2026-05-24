import { apiClient } from "./client";
import type { ApiResponse } from "../types/auth";
import type { BookingRecord, CreateBookingInput } from "../types/booking";

export async function createBooking(input: CreateBookingInput) {
  const response = await apiClient.post<ApiResponse<BookingRecord>>(
    "/bookings",
    input,
  );
  return response.data.data;
}
