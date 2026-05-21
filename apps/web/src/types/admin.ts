import type { HotelStatus } from './merchant'

export type AdminHotel = {
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
  createdAt?: string
  updatedAt?: string
}

export type AuditHotelListParams = {
  status?: HotelStatus | 'ALL'
}
