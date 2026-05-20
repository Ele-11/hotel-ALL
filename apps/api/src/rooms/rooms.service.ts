import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HotelStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  NormalizedRoomCreateDto,
  NormalizedRoomUpdateDto,
  RoomDto,
} from './dto/room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(merchantId: number, dto: RoomDto) {
    const data = normalizeRoomCreateDto(dto);

    try {
      const room = await this.prisma.$transaction(async (tx) => {
        const hotel = await tx.hotel.findFirst({
          where: { id: data.hotelId, merchantId },
        });

        if (!hotel) {
          throw new NotFoundException('Hotel not found');
        }

        const createdRoom = await tx.roomType.create({
          data,
        });
        await this.resetHotelReviewState(tx, data.hotelId);

        return createdRoom;
      });

      return formatRoom(room);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Room type name already exists');
      }

      throw error;
    }
  }

  async update(idValue: string, merchantId: number, dto: RoomDto) {
    const id = parseId(idValue, 'room id');
    const data = normalizeRoomUpdateDto(dto);

    try {
      const room = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.roomType.findUnique({
          where: { id },
          include: { hotel: true },
        });

        if (!existing || existing.hotel?.merchantId !== merchantId) {
          throw new NotFoundException('Room type not found');
        }

        const updatedRoom = await tx.roomType.update({
          where: { id },
          data,
        });
        await this.resetHotelReviewState(tx, existing.hotelId);

        return updatedRoom;
      });

      return formatRoom(room);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Room type name already exists');
      }

      throw error;
    }
  }

  private async resetHotelReviewState(
    tx: Prisma.TransactionClient,
    hotelId: number,
  ) {
    await tx.hotel.update({
      where: { id: hotelId },
      data: {
        status: HotelStatus.PENDING_REVIEW,
        rejectReason: null,
      },
    });
  }
}

function normalizeRoomCreateDto(dto: RoomDto): NormalizedRoomCreateDto {
  assertRoomBody(dto);

  return {
    hotelId: normalizePositiveInteger(dto.hotelId, 'hotelId'),
    ...normalizeRoomUpdateDto(dto),
  };
}

function normalizeRoomUpdateDto(dto: RoomDto): NormalizedRoomUpdateDto {
  assertRoomBody(dto);

  return {
    name: normalizeRequiredString(dto.name, 'name'),
    price: normalizePositiveFiniteNumber(dto.price, 'price'),
  };
}

function assertRoomBody(value: unknown): asserts value is RoomDto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Room payload must be an object');
  }
}

function parseId(value: string, fieldName: string): number {
  return normalizePositiveInteger(value, fieldName);
}

function normalizePositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }

    return value;
  }

  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  const normalized = Number(value);
  if (!Number.isSafeInteger(normalized)) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  return normalized;
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

function normalizePositiveFiniteNumber(
  value: unknown,
  fieldName: string,
): number {
  const text = typeof value === 'number' ? String(value) : value;

  if (typeof text !== 'string' || !/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(text)) {
    throw new BadRequestException(
      `${fieldName} must be a positive decimal with up to 2 decimal places`,
    );
  }

  const normalized = Number(text);
  if (
    !Number.isFinite(normalized) ||
    normalized <= 0 ||
    normalized > 99999999.99
  ) {
    throw new BadRequestException(
      `${fieldName} must be greater than 0 and at most 99999999.99`,
    );
  }

  return normalized;
}

function formatRoom<T extends { price: unknown }>(room: T) {
  return {
    ...room,
    price: Number(room.price).toFixed(2),
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
