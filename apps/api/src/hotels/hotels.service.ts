import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HotelStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HotelDto, NormalizedHotelDto } from './dto/hotel.dto';

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

  async create(merchantId: number, dto: HotelDto) {
    const data = normalizeHotelCreateDto(dto);

    return this.prisma.hotel.create({
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
  }

  async update(idValue: string, merchantId: number, dto: HotelDto) {
    const id = parseId(idValue);
    const existing = await this.prisma.hotel.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      throw new NotFoundException('Hotel not found');
    }

    const data = normalizeHotelDto(dto, false);

    return this.prisma.hotel.update({
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
  }
}

function parseId(value: string): number {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException('Invalid hotel id');
  }

  return id;
}

function normalizeHotelDto(
  dto: HotelDto,
  requireAllFields: boolean,
): Partial<NormalizedHotelDto> {
  const data: Partial<NormalizedHotelDto> = {};

  if (requireAllFields || dto.nameCn !== undefined) {
    data.nameCn = normalizeRequiredString(dto.nameCn, 'nameCn');
  }

  if (requireAllFields || dto.nameEn !== undefined) {
    data.nameEn = normalizeRequiredString(dto.nameEn, 'nameEn');
  }

  if (requireAllFields || dto.address !== undefined) {
    data.address = normalizeRequiredString(dto.address, 'address');
  }

  if (requireAllFields || dto.starRating !== undefined) {
    data.starRating = normalizeStarRating(dto.starRating);
  }

  if (requireAllFields || dto.openedAt !== undefined) {
    data.openedAt = normalizeOpenedAt(dto.openedAt);
  }

  if (requireAllFields || dto.imageUrl !== undefined) {
    data.imageUrl = normalizeImageUrl(dto.imageUrl);
  }

  if (requireAllFields || dto.facilities !== undefined) {
    data.facilities = normalizeFacilities(dto.facilities);
  }

  return data;
}

function normalizeHotelCreateDto(dto: HotelDto): NormalizedHotelDto {
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
    return value.map((item) => normalizeFacility(item));
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
