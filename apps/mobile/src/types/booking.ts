export type CreateBookingInput = {
  hotelId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
};

export type BookingRecord = {
  id: number;
  userId: number;
  hotelId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalPrice: string;
};
