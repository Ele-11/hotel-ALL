export type HotelDto = {
  nameCn?: unknown;
  nameEn?: unknown;
  address?: unknown;
  starRating?: unknown;
  openedAt?: unknown;
  imageUrl?: unknown;
  facilities?: unknown;
};

export type NormalizedHotelDto = {
  nameCn: string;
  nameEn: string;
  address: string;
  starRating: number;
  openedAt: Date;
  imageUrl: string | null;
  facilities: string[];
};
