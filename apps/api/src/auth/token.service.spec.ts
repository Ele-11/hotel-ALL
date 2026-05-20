import { Role } from '@prisma/client';
import { TokenService } from './token.service';

describe('TokenService', () => {
  it('signs and verifies a current user token', () => {
    const service = new TokenService('test-secret', 3600);

    const token = service.sign({
      id: 1,
      username: 'merchant01',
      role: Role.MERCHANT,
    });

    expect(service.verify(token)).toMatchObject({
      id: 1,
      username: 'merchant01',
      role: Role.MERCHANT,
    });
  });

  it('rejects a tampered token', () => {
    const service = new TokenService('test-secret', 3600);
    const token = service.sign({
      id: 1,
      username: 'user01',
      role: Role.USER,
    });

    expect(() => service.verify(`${token.slice(0, -2)}xx`)).toThrow(
      'Invalid token',
    );
  });
});
