import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { HotelDto } from './dto/hotel.dto';
import { HotelsService } from './hotels.service';

@Controller('hotels')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get('my')
  async listMine(@CurrentUser() currentUser: CurrentUserType) {
    return success(await this.hotelsService.listMine(currentUser.id));
  }

  @Post()
  async create(
    @CurrentUser() currentUser: CurrentUserType,
    @Body() dto: HotelDto,
  ) {
    return success(await this.hotelsService.create(currentUser.id, dto));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Body() dto: HotelDto,
  ) {
    return success(await this.hotelsService.update(id, currentUser.id, dto));
  }
}

function success<T>(data: T) {
  return {
    code: 0,
    message: 'success',
    data,
  };
}
