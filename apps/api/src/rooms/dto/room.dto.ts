export type RoomDto = {
  hotelId?: unknown;
  name?: unknown;
  price?: unknown;
};

export type NormalizedRoomCreateDto = {
  hotelId: number;
  name: string;
  price: number;
};

export type NormalizedRoomUpdateDto = {
  name: string;
  price: number;
};
