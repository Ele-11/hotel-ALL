import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

type StoredUser = {
  id: number;
  username: string;
  password: string;
  role: Role;
};

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

type PublicUser = {
  id: number;
  username: string;
  role: Role;
};

type LoginBody = {
  token: string;
  user: PublicUser;
};

function createPrismaMock() {
  const users: StoredUser[] = [];
  let nextId = 1;

  return {
    user: {
      create: jest.fn(({ data }: { data: Omit<StoredUser, 'id'> }) => {
        const existing = users.find((user) => user.username === data.username);
        if (existing) {
          const error = new Error('Unique constraint failed') as Error & {
            code?: string;
          };
          error.code = 'P2002';
          throw error;
        }

        const user = {
          id: nextId,
          ...data,
        };
        nextId += 1;
        users.push(user);
        return Promise.resolve(user);
      }),
      findUnique: jest.fn(
        ({ where }: { where: { username?: string; id?: number } }) => {
          const user =
            where.username !== undefined
              ? users.find((item) => item.username === where.username)
              : users.find((item) => item.id === where.id);

          return Promise.resolve(user ?? null);
        },
      ),
    },
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };
}

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.AUTH_TOKEN_SECRET = 'test-auth-secret';
    process.env.AUTH_TOKEN_EXPIRES_IN_SECONDS = '3600';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('registers a USER account', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'user01',
        password: 'user123456',
        role: 'USER',
      })
      .expect(201)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<
          PublicUser & { password?: string }
        >;

        expect(responseBody).toMatchObject({
          code: 0,
          message: 'success',
          data: {
            id: 1,
            username: 'user01',
            role: 'USER',
          },
        });
        expect(responseBody.data.password).toBeUndefined();
      });
  });

  it('registers a MERCHANT account', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'merchant01',
        password: 'merchant123456',
        role: 'MERCHANT',
      })
      .expect(201)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<PublicUser>;

        expect(responseBody.data).toMatchObject({
          username: 'merchant01',
          role: 'MERCHANT',
        });
      });
  });

  it('does not allow ADMIN registration', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'admin01',
        password: 'admin123456',
        role: 'ADMIN',
      })
      .expect(400)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<null>;

        expect(responseBody).toMatchObject({
          code: 400,
          data: null,
        });
      });
  });

  it('logs in and returns the current user from /auth/me', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      username: 'user01',
      password: 'user123456',
      role: 'USER',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'user01',
        password: 'user123456',
      })
      .expect(201);

    const loginBody = loginResponse.body as ApiEnvelope<LoginBody>;

    expect(loginBody.data).toMatchObject({
      user: {
        id: 1,
        username: 'user01',
        role: 'USER',
      },
    });
    expect(typeof loginBody.data.token).toBe('string');

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginBody.data.token}`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<PublicUser>;

        expect(responseBody).toMatchObject({
          code: 0,
          message: 'success',
          data: {
            id: 1,
            username: 'user01',
            role: 'USER',
          },
        });
      });
  });

  it('rejects bad credentials', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      username: 'user01',
      password: 'user123456',
      role: 'USER',
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'user01',
        password: 'wrong-password',
      })
      .expect(401)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<null>;

        expect(responseBody).toMatchObject({
          code: 401,
          data: null,
        });
      });
  });

  it('rejects /auth/me without a bearer token', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<null>;

        expect(responseBody).toMatchObject({
          code: 401,
          data: null,
        });
      });
  });
});
