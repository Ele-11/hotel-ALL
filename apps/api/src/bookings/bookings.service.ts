import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HotelStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBookingDto,
  NormalizedCreateBookingDto,
} from './dto/create-booking.dto';

const MAX_DATABASE_INT = 2147483647;
const MAX_GUEST_COUNT = 20;

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateBookingDto) {
    const data = normalizeCreateBookingDto(dto);
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: data.hotelId,
        status: HotelStatus.PUBLISHED,
      },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const roomType = await this.prisma.roomType.findFirst({
      where: {
        id: data.roomId,
        hotelId: data.hotelId,
      },
    });

    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    const nights = getNights(data.checkInDate, data.checkOutDate);
    const totalPrice = (Number(roomType.price) * nights).toFixed(2);
    const booking = await this.prisma.booking.create({
      data: {
        userId,
        hotelId: data.hotelId,
        roomTypeId: data.roomId,
        checkInDate: new Date(`${data.checkInDate}T00:00:00.000Z`),
        checkOutDate: new Date(`${data.checkOutDate}T00:00:00.000Z`),
        guestCount: data.guestCount,
        totalPrice,
      },
    });

    return {
      id: booking.id,
      userId: booking.userId,
      hotelId: booking.hotelId,
      roomId: booking.roomTypeId,
      checkInDate: booking.checkInDate.toISOString().slice(0, 10),
      checkOutDate: booking.checkOutDate.toISOString().slice(0, 10),
      guestCount: booking.guestCount,
      totalPrice: Number(booking.totalPrice).toFixed(2),
    };
  }
}

function normalizeCreateBookingDto(
  dto: CreateBookingDto,
): NormalizedCreateBookingDto {
  assertBookingBody(dto);

  return {
    hotelId: normalizePositiveInteger(dto.hotelId, 'hotelId'),
    roomId: normalizePositiveInteger(dto.roomId, 'roomId'),
    checkInDate: normalizeDateString(dto.checkInDate, 'checkInDate'),
    checkOutDate: normalizeDateString(dto.checkOutDate, 'checkOutDate'),
    guestCount: normalizeGuestCount(dto.guestCount),
  };
}

function assertBookingBody(value: unknown): asserts value is CreateBookingDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Booking payload must be an object');
  }
}

function normalizePositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value === 'number') {
    if (
      !Number.isSafeInteger(value) ||
      value <= 0 ||
      value > MAX_DATABASE_INT
    ) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }

    return value;
  }

  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  const normalized = Number(value);
  if (!Number.isSafeInteger(normalized) || normalized > MAX_DATABASE_INT) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  return normalized;
}

function normalizeDateString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${fieldName} must be in YYYY-MM-DD format`);
  }

  const normalized = value.trim();
  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid date`);
  }

  return normalized;
}

function normalizeGuestCount(value: unknown): number {
  const guestCount = normalizePositiveInteger(value, 'guestCount');
  if (guestCount > MAX_GUEST_COUNT) {
    throw new BadRequestException(
      `guestCount must be between 1 and ${MAX_GUEST_COUNT}`,
    );
  }

  return guestCount;
}

function getNights(checkInDate: string, checkOutDate: string): number {
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
