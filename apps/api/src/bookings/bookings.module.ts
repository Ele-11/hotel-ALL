import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
