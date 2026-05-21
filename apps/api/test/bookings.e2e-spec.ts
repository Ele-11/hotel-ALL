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

type StoredRoomType = {
  id: number;
  hotelId: number;
  name: string;
  price: string;
  createdAt: Date;
  updatedAt: Date;
};

type StoredBooking = {
  id: number;
  userId: number;
  hotelId: number;
  roomTypeId: number;
  checkInDate: Date;
  checkOutDate: Date;
  guestCount: number;
  totalPrice: string;
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

type BookingResponse = {
  id: number;
  userId: number;
  hotelId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalPrice: string;
};

function createPrismaMock() {
  const users: StoredUser[] = [];
  const hotels: StoredHotel[] = [];
  const roomTypes: StoredRoomType[] = [];
  const bookings: StoredBooking[] = [];
  let nextUserId = 1;
  let nextHotelId = 1;
  let nextRoomTypeId = 1;
  let nextBookingId = 1;

  const prismaMock = {
    user: {
      create: jest.fn(({ data }: { data: Omit<StoredUser, 'id'> }) => {
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
      findFirst: jest.fn(
        ({ where }: { where?: { id?: number; status?: HotelStatus } }) => {
          const hotel =
            hotels.find((item) => {
              if (where?.id !== undefined && item.id !== where.id) {
                return false;
              }

              if (where?.status !== undefined && item.status !== where.status) {
                return false;
              }

              return true;
            }) ?? null;

          return Promise.resolve(hotel);
        },
      ),
      findMany: jest.fn(() => Promise.resolve([])),
    },
    roomType: {
      findFirst: jest.fn(
        ({
          where,
        }: {
          where?: {
            id?: number;
            hotelId?: number;
          };
        }) => {
          const roomType =
            roomTypes.find((item) => {
              if (where?.id !== undefined && item.id !== where.id) {
                return false;
              }

              if (
                where?.hotelId !== undefined &&
                item.hotelId !== where.hotelId
              ) {
                return false;
              }

              return true;
            }) ?? null;

          return Promise.resolve(roomType);
        },
      ),
      findMany: jest.fn(() => Promise.resolve([])),
    },
    booking: {
      create: jest.fn(
        ({
          data,
        }: {
          data: Omit<
            StoredBooking,
            'id' | 'createdAt' | 'updatedAt' | 'totalPrice'
          > & { totalPrice: string };
        }) => {
          const now = new Date();
          const booking = {
            id: nextBookingId,
            ...data,
            totalPrice: Number(data.totalPrice).toFixed(2),
            createdAt: now,
            updatedAt: now,
          };
          nextBookingId += 1;
          bookings.push(booking);
          return Promise.resolve(booking);
        },
      ),
    },
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    __testing: {
      createHotel: (
        data: Omit<
          StoredHotel,
          'id' | 'createdAt' | 'updatedAt' | 'openedAt'
        > & {
          openedAt: string | Date;
        },
      ) => {
        const now = new Date();
        const hotel = {
          id: nextHotelId,
          ...data,
          openedAt: new Date(data.openedAt),
          createdAt: now,
          updatedAt: now,
        };
        nextHotelId += 1;
        hotels.push(hotel);
        return hotel;
      },
      createRoomType: (
        data: Omit<
          StoredRoomType,
          'id' | 'createdAt' | 'updatedAt' | 'price'
        > & {
          price: number | string;
        },
      ) => {
        const now = new Date();
        const roomType = {
          id: nextRoomTypeId,
          ...data,
          price: Number(data.price).toFixed(2),
          createdAt: now,
          updatedAt: now,
        };
        nextRoomTypeId += 1;
        roomTypes.push(roomType);
        return roomType;
      },
      getBookings: () => bookings,
    },
  };

  return prismaMock;
}

describe('Bookings (e2e)', () => {
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

  it('allows a USER to create a booking and calculates total price on the server', async () => {
    const userToken = await registerAndLogin('user01', Role.USER);
    const hotel = prismaMock.__testing.createHotel({
      nameCn: '已发布酒店',
      nameEn: 'Published Hotel',
      address: '上海市黄浦区中山东一路 1 号',
      starRating: 5,
      openedAt: '2020-01-01T00:00:00.000Z',
      imageUrl: null,
      facilities: ['WiFi'],
      status: HotelStatus.PUBLISHED,
      rejectReason: null,
      merchantId: 1,
    });
    const room = prismaMock.__testing.createRoomType({
      hotelId: hotel.id,
      name: '高级大床房',
      price: 399,
    });

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        hotelId: hotel.id,
        roomId: room.id,
        checkInDate: '2026-06-01',
        checkOutDate: '2026-06-03',
        guestCount: 2,
      })
      .expect(201)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<BookingResponse>;

        expect(responseBody.code).toBe(0);
        expect(responseBody.data).toEqual({
          id: 1,
          userId: 1,
          hotelId: hotel.id,
          roomId: room.id,
          checkInDate: '2026-06-01',
          checkOutDate: '2026-06-03',
          guestCount: 2,
          totalPrice: '798.00',
        });
      });

    expect(prismaMock.__testing.getBookings()).toHaveLength(1);
  });

  it('rejects unauthenticated and non-USER access', async () => {
    const merchantToken = await registerAndLogin('merchant01', Role.MERCHANT);
    const adminToken = await createAdminAndLogin('admin01');

    await request(app.getHttpServer()).post('/bookings').send({}).expect(401);

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({})
      .expect(403);

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(403);
  });

  it('rejects invalid dates and guest counts', async () => {
    const userToken = await registerAndLogin('user02', Role.USER);
    const hotel = prismaMock.__testing.createHotel({
      nameCn: '已发布酒店',
      nameEn: 'Published Hotel Two',
      address: '上海市黄浦区中山东一路 2 号',
      starRating: 5,
      openedAt: '2020-01-01T00:00:00.000Z',
      imageUrl: null,
      facilities: ['WiFi'],
      status: HotelStatus.PUBLISHED,
      rejectReason: null,
      merchantId: 2,
    });
    const room = prismaMock.__testing.createRoomType({
      hotelId: hotel.id,
      name: '豪华双床房',
      price: 599,
    });

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        hotelId: hotel.id,
        roomId: room.id,
        checkInDate: '2026-06-03',
        checkOutDate: '2026-06-03',
        guestCount: 2,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        hotelId: hotel.id,
        roomId: room.id,
        checkInDate: '2026-06-01',
        checkOutDate: '2026-06-03',
        guestCount: 0,
      })
      .expect(400);
  });

  it('rejects unpublished hotels and rooms that do not belong to the hotel', async () => {
    const userToken = await registerAndLogin('user03', Role.USER);
    const publishedHotel = prismaMock.__testing.createHotel({
      nameCn: '已发布酒店',
      nameEn: 'Published Hotel Three',
      address: '上海市黄浦区中山东一路 3 号',
      starRating: 5,
      openedAt: '2020-01-01T00:00:00.000Z',
      imageUrl: null,
      facilities: ['WiFi'],
      status: HotelStatus.PUBLISHED,
      rejectReason: null,
      merchantId: 3,
    });
    const offlineHotel = prismaMock.__testing.createHotel({
      nameCn: '已下线酒店',
      nameEn: 'Offline Hotel',
      address: '上海市黄浦区中山东一路 4 号',
      starRating: 4,
      openedAt: '2020-01-01T00:00:00.000Z',
      imageUrl: null,
      facilities: ['WiFi'],
      status: HotelStatus.OFFLINE,
      rejectReason: null,
      merchantId: 4,
    });
    const publishedRoom = prismaMock.__testing.createRoomType({
      hotelId: publishedHotel.id,
      name: '高级套房',
      price: 699,
    });

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        hotelId: offlineHotel.id,
        roomId: publishedRoom.id,
        checkInDate: '2026-06-01',
        checkOutDate: '2026-06-02',
        guestCount: 1,
      })
      .expect(404);

    const otherHotel = prismaMock.__testing.createHotel({
      nameCn: '另一家已发布酒店',
      nameEn: 'Another Published Hotel',
      address: '上海市黄浦区中山东一路 5 号',
      starRating: 5,
      openedAt: '2020-01-01T00:00:00.000Z',
      imageUrl: null,
      facilities: ['WiFi'],
      status: HotelStatus.PUBLISHED,
      rejectReason: null,
      merchantId: 5,
    });
    const otherRoom = prismaMock.__testing.createRoomType({
      hotelId: otherHotel.id,
      name: '行政套房',
      price: 899,
    });

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        hotelId: publishedHotel.id,
        roomId: otherRoom.id,
        checkInDate: '2026-06-01',
        checkOutDate: '2026-06-02',
        guestCount: 1,
      })
      .expect(404);
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
});
