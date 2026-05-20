import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

function createContext(role?: Role): ExecutionContext {
  const handler = function handler() {};
  const controller = class TestController {};

  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({
        user: role
          ? {
              id: 1,
              username: 'tester',
              role,
            }
          : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows users with a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.MERCHANT]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext(Role.MERCHANT))).toBe(true);
  });

  it('rejects users with the wrong role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(createContext(Role.USER))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects unauthenticated requests when roles are required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.USER]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(createContext())).toThrow(
      ForbiddenException,
    );
  });

  it('allows routes without role metadata', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('reads the roles metadata key', () => {
    const getAllAndOverride = jest.fn().mockReturnValue([Role.ADMIN]);
    const reflector = {
      getAllAndOverride,
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = createContext(Role.ADMIN);

    guard.canActivate(context);

    expect(getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
