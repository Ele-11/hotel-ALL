import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const HASH_PREFIX = 'scrypt';
const HASH_VERSION = 'v1';
const KEY_LENGTH = 64;

@Injectable()
export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

    return [HASH_PREFIX, HASH_VERSION, salt, derivedKey.toString('hex')].join(
      ':',
    );
  }

  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [prefix, version, salt, hash] = storedHash.split(':');

    if (prefix !== HASH_PREFIX || version !== HASH_VERSION || !salt || !hash) {
      return false;
    }

    const storedBuffer = Buffer.from(hash, 'hex');
    const derivedBuffer = (await scrypt(
      password,
      salt,
      storedBuffer.length,
    )) as Buffer | string;

    if (typeof derivedBuffer === 'string') {
      return false;
    }

    if (storedBuffer.length !== derivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(storedBuffer, derivedBuffer);
  }
}
