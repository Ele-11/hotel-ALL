import { Role } from '@prisma/client';

export type RegisterDto = {
  username?: string;
  password?: string;
  role?: Role;
};
