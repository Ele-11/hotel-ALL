import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';

@Module({
  imports: [AuthModule],
  controllers: [HotelsController],
  providers: [HotelsService],
})
export class HotelsModule {}
