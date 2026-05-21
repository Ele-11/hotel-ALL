import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BookingsService } from './bookings.service';
import type { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.USER)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(
    @CurrentUser() currentUser: CurrentUserType,
    @Body() dto: CreateBookingDto,
  ) {
    return success(await this.bookingsService.create(currentUser.id, dto));
  }
}

function success<T>(data: T) {
  return {
    code: 0,
    message: 'success',
    data,
  };
}
