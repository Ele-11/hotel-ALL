export type HotelSearchParams = {
  city: string;
  keyword: string;
  checkInDate: string;
  checkOutDate: string;
};

export type HotelListQuery = Partial<HotelSearchParams> & {
  page?: number;
  pageSize?: number;
};

export type PublicHotelListItem = {
  id: number;
  nameCn: string;
  address: string;
  starRating: number;
  imageUrl: string | null;
  minPrice: string | null;
};

export type PublicHotelListResponse = {
  items: PublicHotelListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PublicRoomType = {
  id: number;
  hotelId: number;
  name: string;
  price: string;
};

export type PublicHotelDetail = {
  id: number;
  nameCn: string;
  nameEn: string;
  address: string;
  starRating: number;
  openedAt: string;
  imageUrl: string | null;
  facilities: string[];
  checkInDate: string | null;
  checkOutDate: string | null;
  nights: number;
  roomTypes: PublicRoomType[];
};
