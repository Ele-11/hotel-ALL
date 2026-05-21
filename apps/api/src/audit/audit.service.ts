import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HotelStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuditHotelQueryDto } from './dto/audit-hotel-query.dto';
import type { RejectHotelDto } from './dto/reject-hotel.dto';

const ALLOWED_STATUSES = new Set<HotelStatus>([
  HotelStatus.PENDING_REVIEW,
  HotelStatus.REJECTED,
  HotelStatus.APPROVED,
  HotelStatus.PUBLISHED,
  HotelStatus.OFFLINE,
]);

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async listHotels(query: AuditHotelQueryDto) {
    const { page, pageSize, status } = normalizeListQuery(query);
    const hotels = await this.prisma.hotel.findMany({
      where: status ? { status } : undefined,
    });

    const sortedHotels = [...hotels].sort((left, right) => right.id - left.id);
    const start = (page - 1) * pageSize;

    return sortedHotels.slice(start, start + pageSize);
  }

  async approveHotel(idValue: string) {
    const hotel = await this.requireHotel(idValue);

    if (hotel.status !== HotelStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Only pending review hotels can be approved',
      );
    }

    return this.prisma.hotel.update({
      where: { id: hotel.id },
      data: {
        status: HotelStatus.APPROVED,
        rejectReason: null,
      },
    });
  }

  async rejectHotel(idValue: string, dto: RejectHotelDto) {
    const hotel = await this.requireHotel(idValue);
    const reason = normalizeRejectReason(dto);

    if (
      hotel.status !== HotelStatus.PENDING_REVIEW &&
      hotel.status !== HotelStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Only pending review or approved hotels can be rejected',
      );
    }

    return this.prisma.hotel.update({
      where: { id: hotel.id },
      data: {
        status: HotelStatus.REJECTED,
        rejectReason: reason,
      },
    });
  }

  async publishHotel(idValue: string) {
    const hotel = await this.requireHotel(idValue);

    if (
      hotel.status !== HotelStatus.APPROVED &&
      hotel.status !== HotelStatus.OFFLINE
    ) {
      throw new BadRequestException(
        'Only approved or offline hotels can be published',
      );
    }

    return this.prisma.hotel.update({
      where: { id: hotel.id },
      data: {
        status: HotelStatus.PUBLISHED,
        rejectReason: null,
      },
    });
  }

  async offlineHotel(idValue: string) {
    const hotel = await this.requireHotel(idValue);

    if (hotel.status !== HotelStatus.PUBLISHED) {
      throw new BadRequestException(
        'Only published hotels can be taken offline',
      );
    }

    return this.prisma.hotel.update({
      where: { id: hotel.id },
      data: {
        status: HotelStatus.OFFLINE,
      },
    });
  }

  private async requireHotel(idValue: string) {
    const id = normalizePositiveInteger(idValue, 'hotel id');
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return hotel;
  }
}

function normalizeListQuery(query: AuditHotelQueryDto) {
  return {
    status: normalizeHotelStatus(query.status),
    page: normalizePageValue(query.page, 'page'),
    pageSize: normalizePageValue(query.pageSize, 'pageSize', 20),
  };
}

function normalizeHotelStatus(value: unknown): HotelStatus | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('status must be a valid hotel status');
  }

  if (!ALLOWED_STATUSES.has(value as HotelStatus)) {
    throw new BadRequestException('status must be a valid hotel status');
  }

  return value as HotelStatus;
}

function normalizeRejectReason(dto: RejectHotelDto): string {
  if (typeof dto !== 'object' || dto === null || Array.isArray(dto)) {
    throw new BadRequestException('reason is required');
  }

  if (typeof dto.reason !== 'string') {
    throw new BadRequestException('reason is required');
  }

  const reason = dto.reason.trim();
  if (!reason) {
    throw new BadRequestException('reason is required');
  }

  return reason;
}

function normalizePageValue(
  value: unknown,
  fieldName: string,
  defaultValue = 1,
) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return normalizePositiveInteger(value, fieldName);
}

function normalizePositiveInteger(value: unknown, fieldName: string) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }

    return value;
  }

  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  const normalized = Number(value);
  if (!Number.isSafeInteger(normalized) || normalized <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  return normalized;
}
