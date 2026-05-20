import {
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { Role } from '@prisma/client';
import { CurrentUser } from './current-user.type';

type TokenPayload = {
  sub: number;
  username: string;
  role: Role;
  iat: number;
  exp: number;
};

@Injectable()
export class TokenService {
  private readonly secret: string;
  private readonly expiresInSeconds: number;

  constructor(
    @Optional() @Inject('AUTH_TOKEN_SECRET') secret?: string,
    @Optional()
    @Inject('AUTH_TOKEN_EXPIRES_IN_SECONDS')
    expiresInSeconds?: number,
  ) {
    this.secret = secret ?? process.env.AUTH_TOKEN_SECRET ?? '';
    this.expiresInSeconds =
      expiresInSeconds ??
      Number(process.env.AUTH_TOKEN_EXPIRES_IN_SECONDS ?? 60 * 60 * 24 * 7);
  }

  sign(user: CurrentUser): string {
    if (!this.secret) {
      throw new Error('AUTH_TOKEN_SECRET is required');
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      iat: issuedAt,
      exp: issuedAt + this.expiresInSeconds,
    };
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };
    const encodedHeader = encodeBase64Url(JSON.stringify(header));
    const encodedPayload = encodeBase64Url(JSON.stringify(payload));
    const signature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
    );

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verify(token: string): CurrentUser {
    if (!this.secret) {
      throw new Error('AUTH_TOKEN_SECRET is required');
    }

    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const expectedSignature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
    );

    if (!safeCompare(signature, expectedSignature)) {
      throw new UnauthorizedException('Invalid token');
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as TokenPayload;

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired');
    }

    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }

  private createSignature(value: string): string {
    return createHmac('sha256', this.secret).update(value).digest('base64url');
  }
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
