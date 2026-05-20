import { Role } from '@prisma/client';
import { Request } from 'express';

export type CurrentUser = {
  id: number;
  username: string;
  role: Role;
};

export type AuthenticatedRequest = Request & {
  user?: CurrentUser;
};
