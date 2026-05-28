import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuditHotelQueryDto } from './dto/audit-hotel-query.dto';
import type { RejectHotelDto } from './dto/reject-hotel.dto';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('hotels')
  async listHotels(@Query() query: AuditHotelQueryDto) {
    return success(await this.auditService.listHotels(query));
  }

  @Patch('hotels/:id/approve')
  async approveHotel(@Param('id') id: string) {
    return success(await this.auditService.approveHotel(id));
  }

  @Patch('hotels/:id/reject')
  async rejectHotel(@Param('id') id: string, @Body() dto: RejectHotelDto) {
    return success(await this.auditService.rejectHotel(id, dto));
  }

  @Patch('hotels/:id/publish')
  async publishHotel(@Param('id') id: string) {
    return success(await this.auditService.publishHotel(id));
  }

  @Patch('hotels/:id/offline')
  async offlineHotel(@Param('id') id: string) {
    return success(await this.auditService.offlineHotel(id));
  }
}

function success<T>(data: T) {
  return {
    code: 0,
    message: 'success',
    data,
  };
}
