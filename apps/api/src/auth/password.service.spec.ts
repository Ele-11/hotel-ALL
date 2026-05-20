import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('hashes a password and verifies the original password', async () => {
    const hash = await service.hashPassword('user123456');

    expect(hash).not.toBe('user123456');
    await expect(service.verifyPassword('user123456', hash)).resolves.toBe(
      true,
    );
  });

  it('rejects an incorrect password', async () => {
    const hash = await service.hashPassword('user123456');

    await expect(service.verifyPassword('wrong-password', hash)).resolves.toBe(
      false,
    );
  });
});
