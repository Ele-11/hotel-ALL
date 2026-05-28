import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HotelStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HotelDto, NormalizedHotelDto } from './dto/hotel.dto';
import {
  NormalizedPublicHotelQuery,
  PublicHotelQueryDto,
} from './dto/public-hotel-query.dto';

@Injectable()
export class HotelsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(merchantId: number) {
    return this.prisma.hotel.findMany({
      where: { merchantId },
      include: {
        roomTypes: {
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async listPublic(query: PublicHotelQueryDto) {
    const normalizedQuery = normalizePublicHotelQuery(query);
    const publishedHotels = await this.prisma.hotel.findMany({
      where: {
        status: HotelStatus.PUBLISHED,
      },
      include: {
        roomTypes: true,
      },
      orderBy: { id: 'asc' },
    });

    const filteredHotels = publishedHotels
      .filter((hotel) => matchPublicHotel(hotel, normalizedQuery))
      .map((hotel) => ({
        id: hotel.id,
        nameCn: hotel.nameCn,
        address: hotel.address,
        starRating: hotel.starRating,
        imageUrl: hotel.imageUrl,
        minPrice: getMinPrice(hotel.roomTypes),
      }));

    const total = filteredHotels.length;
    const totalPages =
      total === 0 ? 0 : Math.ceil(total / normalizedQuery.pageSize);
    const start = (normalizedQuery.page - 1) * normalizedQuery.pageSize;

    return {
      items: filteredHotels.slice(start, start + normalizedQuery.pageSize),
      page: normalizedQuery.page,
      pageSize: normalizedQuery.pageSize,
      total,
      totalPages,
    };
  }

  async getPublicById(idValue: string, query: PublicHotelQueryDto) {
    const id = parseId(idValue);
    const normalizedQuery = normalizePublicHotelQuery(query);
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id,
        status: HotelStatus.PUBLISHED,
      },
      include: {
        roomTypes: true,
      },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return {
      id: hotel.id,
      nameCn: hotel.nameCn,
      nameEn: hotel.nameEn,
      address: hotel.address,
      starRating: hotel.starRating,
      openedAt: hotel.openedAt,
      imageUrl: hotel.imageUrl,
      facilities: hotel.facilities,
      checkInDate: normalizedQuery.checkInDate,
      checkOutDate: normalizedQuery.checkOutDate,
      nights: getNights(
        normalizedQuery.checkInDate,
        normalizedQuery.checkOutDate,
      ),
      roomTypes: [...hotel.roomTypes]
        .sort((left, right) => Number(left.price) - Number(right.price))
        .map(formatPublicRoomType),
    };
  }

  async listPublicRooms(idValue: string) {
    const hotelId = parseId(idValue);
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        status: HotelStatus.PUBLISHED,
      },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const roomTypes = await this.prisma.roomType.findMany({
      where: {
        hotelId,
      },
      orderBy: {
        price: 'asc',
      },
    });

    return roomTypes.map(formatPublicRoomType);
  }

  async create(merchantId: number, dto: HotelDto) {
    const data = normalizeHotelCreateDto(dto);

    try {
      return await this.prisma.hotel.create({
        data: {
          ...data,
          status: HotelStatus.PENDING_REVIEW,
          rejectReason: null,
          merchantId,
        },
        include: {
          roomTypes: {
            orderBy: { id: 'asc' },
          },
        },
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Hotel English name already exists');
      }

      throw error;
    }
  }

  async update(idValue: string, merchantId: number, dto: HotelDto) {
    const id = parseId(idValue);
    const data = normalizeHotelCreateDto(dto);
    const existing = await this.prisma.hotel.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      throw new NotFoundException('Hotel not found');
    }

    try {
      return await this.prisma.hotel.update({
        where: { id },
        data: {
          ...data,
          status: HotelStatus.PENDING_REVIEW,
          rejectReason: null,
        },
        include: {
          roomTypes: {
            orderBy: { id: 'asc' },
          },
        },
      });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Hotel English name already exists');
      }

      throw error;
    }
  }
}

function parseId(value: string): number {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException('Invalid hotel id');
  }

  return id;
}

function normalizeHotelCreateDto(dto: HotelDto): NormalizedHotelDto {
  assertHotelBody(dto);

  return {
    nameCn: normalizeRequiredString(dto.nameCn, 'nameCn'),
    nameEn: normalizeRequiredString(dto.nameEn, 'nameEn'),
    address: normalizeRequiredString(dto.address, 'address'),
    starRating: normalizeStarRating(dto.starRating),
    openedAt: normalizeOpenedAt(dto.openedAt),
    imageUrl: normalizeImageUrl(dto.imageUrl),
    facilities: normalizeFacilities(dto.facilities),
  };
}

function normalizePublicHotelQuery(
  dto: PublicHotelQueryDto,
): NormalizedPublicHotelQuery {
  return {
    city: normalizeOptionalString(dto.city),
    keyword: normalizeOptionalString(dto.keyword),
    checkInDate: normalizeOptionalDateString(dto.checkInDate, 'checkInDate'),
    checkOutDate: normalizeOptionalDateString(dto.checkOutDate, 'checkOutDate'),
    page: normalizePositiveInteger(dto.page, 'page', 1),
    pageSize: normalizePositiveInteger(dto.pageSize, 'pageSize', 10),
  };
}

function assertHotelBody(value: unknown): asserts value is HotelDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Hotel payload must be an object');
  }
}

function normalizeRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} is required`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`);
  }

  return normalized;
}

function normalizeOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('Query value must be a string');
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeStarRating(value: unknown): number {
  const starRating = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(starRating) || starRating < 1 || starRating > 5) {
    throw new BadRequestException('starRating must be an integer from 1 to 5');
  }

  return starRating;
}

function normalizeOpenedAt(value: unknown): Date {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    throw new BadRequestException('openedAt must be a valid date');
  }

  const openedAt = new Date(value);
  if (Number.isNaN(openedAt.getTime())) {
    throw new BadRequestException('openedAt must be a valid date');
  }

  return openedAt;
}

function normalizeOptionalDateString(
  value: unknown,
  fieldName: string,
): string | null {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new BadRequestException(`${fieldName} must be in YYYY-MM-DD format`);
  }

  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid date`);
  }

  return normalized;
}

function normalizePositiveInteger(
  value: unknown,
  fieldName: string,
  fallback: number,
): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  return normalized;
}

function normalizeImageUrl(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('imageUrl must be a string');
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeFacilities(value: unknown): string[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeFacility(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  throw new BadRequestException('facilities must be an array or string');
}

function normalizeFacility(value: unknown): string {
  if (typeof value !== 'string') {
    throw new BadRequestException('facilities must contain only strings');
  }

  return value.trim();
}

function matchPublicHotel(
  hotel: {
    nameCn: string;
    nameEn: string;
    address: string;
  },
  query: NormalizedPublicHotelQuery,
): boolean {
  if (
    query.city &&
    !hotel.address.toLowerCase().includes(query.city.toLowerCase())
  ) {
    return false;
  }

  if (!query.keyword) {
    return true;
  }

  const keyword = query.keyword.toLowerCase();
  return (
    hotel.nameCn.toLowerCase().includes(keyword) ||
    hotel.nameEn.toLowerCase().includes(keyword) ||
    hotel.address.toLowerCase().includes(keyword)
  );
}

function getMinPrice(roomTypes: Array<{ price: unknown }>): string | null {
  if (roomTypes.length === 0) {
    return null;
  }

  return Number(
    [...roomTypes].sort(
      (left, right) => Number(left.price) - Number(right.price),
    )[0].price,
  ).toFixed(2);
}

function getNights(
  checkInDate: string | null,
  checkOutDate: string | null,
): number {
  if (!checkInDate || !checkOutDate) {
    return 0;
  }

  const start = new Date(`${checkInDate}T00:00:00.000Z`);
  const end = new Date(`${checkOutDate}T00:00:00.000Z`);
  const diffDays = Math.floor(
    (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays <= 0) {
    throw new BadRequestException(
      'checkOutDate must be later than checkInDate',
    );
  }

  return diffDays;
}

function formatPublicRoomType<T extends { price: unknown }>(roomType: T) {
  return {
    ...roomType,
    price: Number(roomType.price).toFixed(2),
  };
}

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
