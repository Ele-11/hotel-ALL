export type HotelStatus =
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'OFFLINE'

export type MerchantRoom = {
  id: number
  hotelId: number
  name: string
  price: string
  createdAt?: string
  updatedAt?: string
}

export type MerchantHotel = {
  id: number
  nameCn: string
  nameEn: string
  address: string
  starRating: number
  openedAt: string
  imageUrl: string | null
  facilities: string[]
  status: HotelStatus
  rejectReason: string | null
  merchantId: number
  roomTypes: MerchantRoom[]
  createdAt?: string
  updatedAt?: string
}

export type MerchantHotelInput = {
  nameCn: string
  nameEn: string
  address: string
  starRating: number
  openedAt: string
  imageUrl?: string | null
  facilities: string[]
}

export type MerchantRoomInput = {
  hotelId?: number
  name: string
  price: number
}
