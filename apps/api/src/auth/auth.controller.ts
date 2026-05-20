import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import type { CurrentUser as CurrentUserType } from './current-user.type';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return success(await this.authService.register(dto));
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return success(await this.authService.login(dto));
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() currentUser: CurrentUserType) {
    return success(currentUser);
  }
}

function success<T>(data: T) {
  return {
    code: 0,
    message: 'success',
    data,
  };
}
