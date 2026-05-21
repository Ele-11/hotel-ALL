import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HotelStatus, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { PasswordService } from '../src/auth/password.service';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type StoredUser = {
  id: number;
  username: string;
  password: string;
  role: Role;
};

type StoredHotel = {
  id: number;
  nameCn: string;
  nameEn: string;
  address: string;
  starRating: number;
  openedAt: Date;
  imageUrl: string | null;
  facilities: string[];
  status: HotelStatus;
  rejectReason: string | null;
  merchantId: number;
  createdAt: Date;
  updatedAt: Date;
};

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

type LoginBody = {
  token: string;
  user: {
    id: number;
    username: string;
    role: Role;
  };
};

type HotelResponse = {
  id: number;
  nameCn: string;
  nameEn: string;
  address: string;
  starRating: number;
  openedAt: string;
  imageUrl: string | null;
  facilities: string[];
  status: HotelStatus;
  rejectReason: string | null;
  merchantId: number;
  createdAt: string;
  updatedAt: string;
};

const hotelPayload = {
  nameCn: '西湖君亭酒店',
  nameEn: 'West Lake Elite Hotel',
  address: '杭州市西湖区灵隐路 8 号',
  starRating: 5,
  openedAt: '2024-01-01T00:00:00.000Z',
  imageUrl: 'https://example.com/west-lake.jpg',
  facilities: ['wifi', 'parking'],
};

function createPrismaMock() {
  const users: StoredUser[] = [];
  const hotels: StoredHotel[] = [];
  let nextUserId = 1;
  let nextHotelId = 1;

  function uniqueError() {
    const error = new Error('Unique constraint failed') as Error & {
      code?: string;
    };
    error.code = 'P2002';
    return error;
  }

  const prismaMock = {
    user: {
      create: jest.fn(({ data }: { data: Omit<StoredUser, 'id'> }) => {
        if (users.some((user) => user.username === data.username)) {
          throw uniqueError();
        }

        const user = {
          id: nextUserId,
          ...data,
        };
        nextUserId += 1;
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
    hotel: {
      create: jest.fn(
        ({
          data,
        }: {
          data: Omit<StoredHotel, 'id' | 'createdAt' | 'updatedAt'>;
        }) => {
          if (hotels.some((hotel) => hotel.nameEn === data.nameEn)) {
            throw uniqueError();
          }

          const now = new Date();
          const hotel = {
            id: nextHotelId,
            createdAt: now,
            updatedAt: now,
            ...data,
            imageUrl: data.imageUrl ?? null,
            facilities: data.facilities ?? [],
            openedAt: new Date(data.openedAt),
          };
          nextHotelId += 1;
          hotels.push(hotel);
          return Promise.resolve(hotel);
        },
      ),
      findMany: jest.fn(
        ({
          where,
        }: {
          where?: { merchantId?: number; status?: HotelStatus };
        } = {}) => {
          const result = hotels.filter((hotel) => {
            if (
              where?.merchantId !== undefined &&
              hotel.merchantId !== where.merchantId
            ) {
              return false;
            }

            if (where?.status !== undefined && hotel.status !== where.status) {
              return false;
            }

            return true;
          });

          return Promise.resolve(result);
        },
      ),
      findFirst: jest.fn(
        ({
          where,
        }: {
          where: { id?: number; merchantId?: number; status?: HotelStatus };
        }) => {
          const hotel =
            hotels.find((item) => {
              if (where.id !== undefined && item.id !== where.id) {
                return false;
              }

              if (
                where.merchantId !== undefined &&
                item.merchantId !== where.merchantId
              ) {
                return false;
              }

              if (where.status !== undefined && item.status !== where.status) {
                return false;
              }

              return true;
            }) ?? null;

          return Promise.resolve(hotel);
        },
      ),
      findUnique: jest.fn(({ where }: { where: { id: number } }) => {
        const hotel = hotels.find((item) => item.id === where.id) ?? null;
        return Promise.resolve(hotel);
      }),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: number };
          data: Partial<StoredHotel>;
        }) => {
          const hotel = hotels.find((item) => item.id === where.id);

          if (!hotel) {
            throw new Error('Hotel not found');
          }

          Object.assign(hotel, data, { updatedAt: new Date() });
          return Promise.resolve(hotel);
        },
      ),
    },
    roomType: {
      findMany: jest.fn(() => Promise.resolve([])),
    },
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    __testing: {
      setHotelState: (
        hotelId: number,
        status: HotelStatus,
        rejectReason: string | null = null,
      ) => {
        const hotel = hotels.find((item) => item.id === hotelId);
        if (!hotel) {
          throw new Error('Hotel not found');
        }

        hotel.status = status;
        hotel.rejectReason = rejectReason;
        hotel.updatedAt = new Date();
      },
    },
  };

  return prismaMock;
}

describe('Admin hotel audit (e2e)', () => {
  let app: INestApplication<App>;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    process.env.AUTH_TOKEN_SECRET = 'test-auth-secret';
    process.env.AUTH_TOKEN_EXPIRES_IN_SECONDS = '3600';

    prismaMock = createPrismaMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows an ADMIN to list pending hotels and filter by status', async () => {
    const adminToken = await createAdminAndLogin('admin01');
    const merchantToken = await registerAndLogin('merchant01', Role.MERCHANT);
    const firstHotel = await createMerchantHotel(merchantToken, hotelPayload);
    const secondHotel = await createMerchantHotel(merchantToken, {
      ...hotelPayload,
      nameCn: '外滩艺宿酒店',
      nameEn: 'Bund Art Hotel',
    });

    prismaMock.__testing.setHotelState(secondHotel.id, HotelStatus.APPROVED);

    await request(app.getHttpServer())
      .get('/audit/hotels')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse[]>;
        expect(responseBody.code).toBe(0);
        expect(responseBody.data).toHaveLength(2);
      });

    await request(app.getHttpServer())
      .get('/audit/hotels?status=PENDING_REVIEW')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse[]>;
        expect(responseBody.data).toEqual([
          expect.objectContaining({
            id: firstHotel.id,
            status: HotelStatus.PENDING_REVIEW,
          }),
        ]);
      });
  });

  it('allows an ADMIN to approve, publish, offline, and republish a hotel', async () => {
    const adminToken = await createAdminAndLogin('admin02');
    const merchantToken = await registerAndLogin('merchant02', Role.MERCHANT);
    const hotel = await createMerchantHotel(merchantToken, hotelPayload);

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${hotel.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse>;
        expect(responseBody.data).toMatchObject({
          id: hotel.id,
          status: HotelStatus.APPROVED,
          rejectReason: null,
        });
      });

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${hotel.id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse>;
        expect(responseBody.data.status).toBe(HotelStatus.PUBLISHED);
      });

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${hotel.id}/offline`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse>;
        expect(responseBody.data.status).toBe(HotelStatus.OFFLINE);
      });

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${hotel.id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse>;
        expect(responseBody.data.status).toBe(HotelStatus.PUBLISHED);
      });
  });

  it('requires a reject reason and stores it when an ADMIN rejects a hotel', async () => {
    const adminToken = await createAdminAndLogin('admin03');
    const merchantToken = await registerAndLogin('merchant03', Role.MERCHANT);
    const hotel = await createMerchantHotel(merchantToken, hotelPayload);

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${hotel.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${hotel.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: '缺少营业资质证明' })
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse>;
        expect(responseBody.data).toMatchObject({
          id: hotel.id,
          status: HotelStatus.REJECTED,
          rejectReason: '缺少营业资质证明',
        });
      });
  });

  it('rejects invalid state transitions and non-admin access', async () => {
    const adminToken = await createAdminAndLogin('admin04');
    const merchantToken = await registerAndLogin('merchant04', Role.MERCHANT);
    const userToken = await registerAndLogin('user01', Role.USER);
    const hotel = await createMerchantHotel(merchantToken, hotelPayload);

    await request(app.getHttpServer())
      .get('/audit/hotels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${hotel.id}/publish`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${hotel.id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${hotel.id}/offline`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });

  async function createAdminAndLogin(username: string) {
    const password = 'password123456';
    const passwordService = app.get(PasswordService);
    const hashedPassword = await passwordService.hashPassword(password);

    await prismaMock.user.create({
      data: {
        username,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username,
        password,
      })
      .expect(201);

    return (loginResponse.body as ApiEnvelope<LoginBody>).data.token;
  }

  async function registerAndLogin(username: string, role: Role) {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username,
        password: 'password123456',
        role,
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username,
        password: 'password123456',
      })
      .expect(201);

    return (loginResponse.body as ApiEnvelope<LoginBody>).data.token;
  }

  async function createMerchantHotel(
    token: string,
    payload: typeof hotelPayload,
  ) {
    const response = await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return (response.body as ApiEnvelope<HotelResponse>).data;
  }
});
