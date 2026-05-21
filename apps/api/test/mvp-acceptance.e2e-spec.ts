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

type PublicUser = {
  id: number;
  username: string;
  role: Role;
};

type LoginBody = {
  token: string;
  user: PublicUser;
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
  roomTypes?: Array<{
    id: number;
    hotelId: number;
    name: string;
    price: string;
  }>;
};

type PublicHotelListResponse = {
  items: Array<{
    id: number;
    nameCn: string;
    address: string;
    starRating: number;
    imageUrl: string | null;
    minPrice: string | null;
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type PublicHotelDetailResponse = {
  id: number;
  nameCn: string;
  nameEn: string;
  address: string;
  starRating: number;
  openedAt: string;
  imageUrl: string | null;
  facilities: string[];
  checkInDate: string | null;
  checkOutDate: string | null;
  nights: number;
  roomTypes: Array<{
    id: number;
    hotelId: number;
    name: string;
    price: string;
  }>;
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
          include,
        }: {
          data: Omit<StoredHotel, 'id' | 'createdAt' | 'updatedAt'>;
          include?: { roomTypes?: boolean };
        }) => {
          if (hotels.some((hotel) => hotel.nameEn === data.nameEn)) {
            throw uniqueError();
          }

          const now = new Date();
          const hotel = {
            id: nextHotelId,
            ...data,
            imageUrl: data.imageUrl ?? null,
            facilities: data.facilities ?? [],
            openedAt: new Date(data.openedAt),
            createdAt: now,
            updatedAt: now,
          };
          nextHotelId += 1;
          hotels.push(hotel);

          return Promise.resolve(
            include?.roomTypes
              ? {
                  ...hotel,
                  roomTypes: roomTypes.filter(
                    (room) => room.hotelId === hotel.id,
                  ),
                }
              : hotel,
          );
        },
      ),
      findMany: jest.fn(
        ({
          where,
          include,
        }: {
          where?: {
            merchantId?: number;
            status?: HotelStatus;
            OR?: Array<{
              address?: { contains: string; mode?: string };
              nameCn?: { contains: string; mode?: string };
              nameEn?: { contains: string; mode?: string };
            }>;
          };
          include?: { roomTypes?: boolean };
        } = {}) => {
          let result = hotels.filter((hotel) => {
            if (
              where?.merchantId !== undefined &&
              hotel.merchantId !== where.merchantId
            ) {
              return false;
            }

            if (where?.status !== undefined && hotel.status !== where.status) {
              return false;
            }

            if (where?.OR && where.OR.length > 0) {
              return where.OR.some((condition) => {
                if (
                  condition.address?.contains &&
                  hotel.address
                    .toLowerCase()
                    .includes(condition.address.contains.toLowerCase())
                ) {
                  return true;
                }

                if (
                  condition.nameCn?.contains &&
                  hotel.nameCn
                    .toLowerCase()
                    .includes(condition.nameCn.contains.toLowerCase())
                ) {
                  return true;
                }

                if (
                  condition.nameEn?.contains &&
                  hotel.nameEn
                    .toLowerCase()
                    .includes(condition.nameEn.contains.toLowerCase())
                ) {
                  return true;
                }

                return false;
              });
            }

            return true;
          });

          result = [...result].sort((left, right) => left.id - right.id);

          return Promise.resolve(
            include?.roomTypes
              ? result.map((hotel) => ({
                  ...hotel,
                  roomTypes: roomTypes
                    .filter((room) => room.hotelId === hotel.id)
                    .sort(
                      (left, right) => Number(left.price) - Number(right.price),
                    ),
                }))
              : result,
          );
        },
      ),
      findFirst: jest.fn(
        ({
          where,
          include,
        }: {
          where?: {
            id?: number;
            merchantId?: number;
            status?: HotelStatus;
          };
          include?: { roomTypes?: boolean };
        }) => {
          const hotel =
            hotels.find((item) => {
              if (where?.id !== undefined && item.id !== where.id) {
                return false;
              }

              if (
                where?.merchantId !== undefined &&
                item.merchantId !== where.merchantId
              ) {
                return false;
              }

              if (where?.status !== undefined && item.status !== where.status) {
                return false;
              }

              return true;
            }) ?? null;

          if (!hotel) {
            return Promise.resolve(null);
          }

          return Promise.resolve(
            include?.roomTypes
              ? {
                  ...hotel,
                  roomTypes: roomTypes
                    .filter((room) => room.hotelId === hotel.id)
                    .sort(
                      (left, right) => Number(left.price) - Number(right.price),
                    ),
                }
              : hotel,
          );
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
          include,
        }: {
          where: { id: number };
          data: Partial<StoredHotel>;
          include?: { roomTypes?: boolean };
        }) => {
          const hotel = hotels.find((item) => item.id === where.id);

          if (!hotel) {
            throw new Error('Hotel not found');
          }

          Object.assign(hotel, {
            ...data,
            updatedAt: new Date(),
          });

          return Promise.resolve(
            include?.roomTypes
              ? {
                  ...hotel,
                  roomTypes: roomTypes.filter(
                    (room) => room.hotelId === hotel.id,
                  ),
                }
              : hotel,
          );
        },
      ),
    },
    roomType: {
      create: jest.fn(
        ({
          data,
        }: {
          data: Omit<
            StoredRoomType,
            'id' | 'createdAt' | 'updatedAt' | 'price'
          > & {
            price: number | string;
          };
        }) => {
          if (
            roomTypes.some(
              (roomType) =>
                roomType.hotelId === data.hotelId &&
                roomType.name === data.name,
            )
          ) {
            throw uniqueError();
          }

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
          return Promise.resolve(roomType);
        },
      ),
      findUnique: jest.fn(
        ({
          where,
          include,
        }: {
          where: {
            id?: number;
            hotelId_name?: { hotelId: number; name: string };
          };
          include?: { hotel?: boolean };
        }) => {
          const roomType =
            roomTypes.find((item) => {
              if (where.id !== undefined && item.id !== where.id) {
                return false;
              }

              if (
                where.hotelId_name !== undefined &&
                (item.hotelId !== where.hotelId_name.hotelId ||
                  item.name !== where.hotelId_name.name)
              ) {
                return false;
              }

              return true;
            }) ?? null;

          if (!roomType) {
            return Promise.resolve(null);
          }

          const hotel =
            hotels.find((item) => item.id === roomType.hotelId) ?? null;
          return Promise.resolve(
            include?.hotel ? { ...roomType, hotel } : roomType,
          );
        },
      ),
      findFirst: jest.fn(
        ({
          where,
          include,
        }: {
          where?: {
            id?: number;
            hotelId?: number;
            hotel?: { merchantId?: number };
          };
          include?: { hotel?: boolean };
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

          if (!roomType) {
            return Promise.resolve(null);
          }

          const hotel =
            hotels.find((item) => item.id === roomType.hotelId) ?? null;
          if (
            where?.hotel?.merchantId !== undefined &&
            hotel?.merchantId !== where.hotel.merchantId
          ) {
            return Promise.resolve(null);
          }

          return Promise.resolve(
            include?.hotel ? { ...roomType, hotel } : roomType,
          );
        },
      ),
      findMany: jest.fn(
        ({
          where,
          orderBy,
        }: {
          where?: { hotelId?: number };
          orderBy?: { price?: 'asc' | 'desc' };
        } = {}) => {
          let result = roomTypes.filter((roomType) => {
            if (where?.hotelId !== undefined) {
              return roomType.hotelId === where.hotelId;
            }

            return true;
          });

          if (orderBy?.price === 'asc') {
            result = [...result].sort(
              (left, right) => Number(left.price) - Number(right.price),
            );
          }

          return Promise.resolve(result);
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: number };
          data: Partial<StoredRoomType>;
        }) => {
          const roomType = roomTypes.find((item) => item.id === where.id);

          if (!roomType) {
            throw new Error('Room type not found');
          }

          Object.assign(roomType, {
            ...data,
            price:
              data.price !== undefined
                ? Number(data.price).toFixed(2)
                : roomType.price,
            updatedAt: new Date(),
          });

          return Promise.resolve(roomType);
        },
      ),
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
      getBookings: () => bookings,
    },
  };

  return {
    ...prismaMock,
    $transaction: jest.fn((callback: (tx: typeof prismaMock) => unknown) =>
      callback(prismaMock),
    ),
  };
}

describe('MVP acceptance (e2e)', () => {
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

  it('supports the full merchant-admin-user MVP flow and hides offline hotels from users', async () => {
    const merchantToken = await registerAndLogin('merchant-m8', Role.MERCHANT);
    const adminToken = await createAdminAndLogin('admin-m8');
    const userToken = await registerAndLogin('user-m8', Role.USER);

    const createdHotelResponse = await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        nameCn: 'Milestone 8 Hotel',
        nameEn: 'Milestone 8 Hotel',
        address: 'Shanghai Pudong Riverside',
        starRating: 5,
        openedAt: '2024-01-01T00:00:00.000Z',
        imageUrl: null,
        facilities: ['wifi', 'gym'],
      })
      .expect(201);
    const createdHotel = (
      createdHotelResponse.body as ApiEnvelope<HotelResponse>
    ).data;

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        hotelId: createdHotel.id,
        name: 'Deluxe King',
        price: 688,
      })
      .expect(201);
    const room = (
      roomResponse.body as ApiEnvelope<{
        id: number;
        hotelId: number;
        name: string;
        price: string;
      }>
    ).data;

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${createdHotel.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse>;
        expect(responseBody.data.status).toBe(HotelStatus.APPROVED);
      });

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${createdHotel.id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse>;
        expect(responseBody.data.status).toBe(HotelStatus.PUBLISHED);
      });

    await request(app.getHttpServer())
      .get('/hotels?city=Shanghai')
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<PublicHotelListResponse>;
        expect(responseBody.data.items).toEqual([
          expect.objectContaining({
            id: createdHotel.id,
            nameCn: 'Milestone 8 Hotel',
            minPrice: '688.00',
          }),
        ]);
      });

    await request(app.getHttpServer())
      .get(
        `/hotels/${createdHotel.id}?checkInDate=2026-06-10&checkOutDate=2026-06-12`,
      )
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<PublicHotelDetailResponse>;
        expect(responseBody.data).toMatchObject({
          id: createdHotel.id,
          checkInDate: '2026-06-10',
          checkOutDate: '2026-06-12',
          nights: 2,
        });
        expect(responseBody.data.roomTypes).toEqual([
          expect.objectContaining({
            id: room.id,
            name: 'Deluxe King',
            price: '688.00',
          }),
        ]);
      });

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        hotelId: createdHotel.id,
        roomId: room.id,
        checkInDate: '2026-06-10',
        checkOutDate: '2026-06-12',
        guestCount: 2,
      })
      .expect(201)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<BookingResponse>;
        expect(responseBody.data).toEqual({
          id: 1,
          userId: 3,
          hotelId: createdHotel.id,
          roomId: room.id,
          checkInDate: '2026-06-10',
          checkOutDate: '2026-06-12',
          guestCount: 2,
          totalPrice: '1376.00',
        });
      });

    expect(prismaMock.__testing.getBookings()).toHaveLength(1);

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${createdHotel.id}/offline`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse>;
        expect(responseBody.data.status).toBe(HotelStatus.OFFLINE);
      });

    await request(app.getHttpServer())
      .get('/hotels?city=Shanghai')
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<PublicHotelListResponse>;
        expect(responseBody.data.items).toEqual([]);
      });

    await request(app.getHttpServer())
      .get(`/hotels/${createdHotel.id}`)
      .expect(404);

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        hotelId: createdHotel.id,
        roomId: room.id,
        checkInDate: '2026-06-10',
        checkOutDate: '2026-06-12',
        guestCount: 2,
      })
      .expect(404);
  });

  it('keeps role boundaries intact for booking and audit actions', async () => {
    const merchantToken = await registerAndLogin(
      'merchant-boundary',
      Role.MERCHANT,
    );
    const userToken = await registerAndLogin('user-boundary', Role.USER);
    const adminToken = await createAdminAndLogin('admin-boundary');
    const merchantHotelResponse = await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        nameCn: 'Boundary Hotel',
        nameEn: 'Boundary Hotel',
        address: 'Hangzhou West Lake',
        starRating: 4,
        openedAt: '2024-01-01T00:00:00.000Z',
        imageUrl: null,
        facilities: ['wifi'],
      })
      .expect(201);
    const hotel = (merchantHotelResponse.body as ApiEnvelope<HotelResponse>)
      .data;

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        hotelId: hotel.id,
        name: 'Boundary Room',
        price: 588,
      })
      .expect(201);
    const room = (
      roomResponse.body as ApiEnvelope<{
        id: number;
        hotelId: number;
        name: string;
        price: string;
      }>
    ).data;

    await request(app.getHttpServer())
      .post('/bookings')
      .send({
        hotelId: hotel.id,
        roomId: room.id,
        checkInDate: '2026-06-01',
        checkOutDate: '2026-06-02',
        guestCount: 1,
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        hotelId: hotel.id,
        roomId: room.id,
        checkInDate: '2026-06-01',
        checkOutDate: '2026-06-02',
        guestCount: 1,
      })
      .expect(403);

    await request(app.getHttpServer())
      .get('/audit/hotels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${hotel.id}/approve`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/audit/hotels/${hotel.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  async function createAdminAndLogin(username: string) {
    const passwordService = app.get(PasswordService);
    const password = 'password123456';
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
