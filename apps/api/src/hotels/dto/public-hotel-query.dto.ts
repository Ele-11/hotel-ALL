export type PublicHotelQueryDto = {
  city?: unknown;
  keyword?: unknown;
  checkInDate?: unknown;
  checkOutDate?: unknown;
  page?: unknown;
  pageSize?: unknown;
};

export type NormalizedPublicHotelQuery = {
  city: string | null;
  keyword: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  page: number;
  pageSize: number;
};
