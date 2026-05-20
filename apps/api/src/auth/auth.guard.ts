import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';
import { AuthenticatedRequest } from './current-user.type';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Login required');
    }

    const token = authorization.slice('Bearer '.length).trim();
    const tokenUser = this.tokenService.verify(token);
    const user = await this.prisma.user.findUnique({
      where: { id: tokenUser.id },
    });

    if (!user) {
      throw new UnauthorizedException('Login required');
    }

    request.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    return true;
  }
}
