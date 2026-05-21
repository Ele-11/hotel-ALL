import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { HotelDto } from './dto/hotel.dto';
import type { PublicHotelQueryDto } from './dto/public-hotel-query.dto';
import { HotelsService } from './hotels.service';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get('my')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  async listMine(@CurrentUser() currentUser: CurrentUserType) {
    return success(await this.hotelsService.listMine(currentUser.id));
  }

  @Get()
  async listPublic(@Query() query: PublicHotelQueryDto) {
    return success(await this.hotelsService.listPublic(query));
  }

  @Get(':id/rooms')
  async listPublicRooms(@Param('id') id: string) {
    return success(await this.hotelsService.listPublicRooms(id));
  }

  @Get(':id')
  async getPublicById(
    @Param('id') id: string,
    @Query() query: PublicHotelQueryDto,
  ) {
    return success(await this.hotelsService.getPublicById(id, query));
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  async create(
    @CurrentUser() currentUser: CurrentUserType,
    @Body() dto: HotelDto,
  ) {
    return success(await this.hotelsService.create(currentUser.id, dto));
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
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
