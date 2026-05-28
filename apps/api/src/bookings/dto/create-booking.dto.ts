export type CreateBookingDto = {
  hotelId?: unknown;
  roomId?: unknown;
  checkInDate?: unknown;
  checkOutDate?: unknown;
  guestCount?: unknown;
};

export type NormalizedCreateBookingDto = {
  hotelId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
};
