import {
  Body,
  Controller,
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
import type { RoomDto } from './dto/room.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async create(
    @CurrentUser() currentUser: CurrentUserType,
    @Body() dto: RoomDto,
  ) {
    return success(await this.roomsService.create(currentUser.id, dto));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Body() dto: RoomDto,
  ) {
    return success(await this.roomsService.update(id, currentUser.id, dto));
  }
}

function success<T>(data: T) {
  return {
    code: 0,
    message: 'success',
    data,
  };
}
