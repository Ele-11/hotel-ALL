import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { CurrentUser } from './current-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<CurrentUser> {
    const username = normalizeUsername(dto.username);
    const password = normalizePassword(dto.password);
    const role = dto.role;

    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    if (role !== Role.USER && role !== Role.MERCHANT) {
      throw new BadRequestException('Role must be USER or MERCHANT');
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          password: await this.passwordService.hashPassword(password),
          role,
        },
      });

      return toCurrentUser(user);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Username already exists');
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<{ token: string; user: CurrentUser }> {
    const username = normalizeUsername(dto.username);
    const password = normalizePassword(dto.password);

    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const currentUser = toCurrentUser(user);

    return {
      token: this.tokenService.sign(currentUser),
      user: currentUser,
    };
  }
}

function normalizeUsername(value: string | undefined): string {
  return value?.trim() ?? '';
}

function normalizePassword(value: string | undefined): string {
  return value ?? '';
}

function toCurrentUser(user: User): CurrentUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
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
