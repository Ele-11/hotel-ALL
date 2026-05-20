import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HotelStatus, Role } from '@prisma/client';
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

type HotelResponse = Omit<
  StoredHotel,
  'openedAt' | 'createdAt' | 'updatedAt'
> & {
  openedAt: string;
  createdAt: string;
  updatedAt: string;
  roomTypes: RoomTypeResponse[];
};

type RoomTypeResponse = Omit<StoredRoomType, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
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

type HotelCreateData = Omit<StoredHotel, 'id' | 'createdAt' | 'updatedAt'>;

type HotelUpdateData = Partial<
  Omit<StoredHotel, 'id' | 'createdAt' | 'updatedAt'>
>;

type RoomTypeCreateData = Omit<
  StoredRoomType,
  'id' | 'price' | 'createdAt' | 'updatedAt'
> & {
  price: number | string;
};

type RoomTypePayload = Omit<RoomTypeCreateData, 'hotelId'>;

type RoomTypeUpdateData = Partial<
  Omit<StoredRoomType, 'id' | 'createdAt' | 'updatedAt'>
>;

const firstHotelPayload = {
  nameCn: 'West Lake Hotel CN',
  nameEn: 'West Lake Hotel',
  address: 'No. 1 Beishan Street, Hangzhou',
  starRating: 5,
  openedAt: '2020-01-01T00:00:00.000Z',
  imageUrl: 'https://example.com/west-lake.jpg',
  facilities: ['wifi', 'parking'],
};

const secondHotelPayload = {
  nameCn: 'Bund Boutique Hotel CN',
  nameEn: 'Bund Boutique Hotel',
  address: 'No. 2 Zhongshan East 1st Road, Shanghai',
  starRating: 4,
  openedAt: '2021-03-15T00:00:00.000Z',
  imageUrl: null,
  facilities: ['wifi'],
};

function createPrismaMock() {
  const users: StoredUser[] = [];
  const hotels: StoredHotel[] = [];
  const roomTypes: StoredRoomType[] = [];
  let nextUserId = 1;
  let nextHotelId = 1;
  let nextRoomTypeId = 1;

  const includeRoomTypes = <T extends StoredHotel>(hotel: T) => ({
    ...hotel,
    roomTypes: roomTypes.filter((roomType) => roomType.hotelId === hotel.id),
  });

  const findHotel = (
    where?: Partial<Pick<StoredHotel, 'id' | 'merchantId' | 'status'>>,
  ) =>
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
    });

  const findRoomType = (where: {
    id?: number;
    hotelId?: number;
    hotelId_name?: { hotelId: number; name: string };
  }) =>
    roomTypes.find((item) => {
      if (where.id !== undefined && item.id !== where.id) {
        return false;
      }

      if (where.hotelId !== undefined && item.hotelId !== where.hotelId) {
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
    });

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
          data: HotelCreateData;
          include?: { roomTypes?: boolean };
        }) => {
          const existing = hotels.find((hotel) => hotel.nameEn === data.nameEn);
          if (existing) {
            const error = new Error('Unique constraint failed') as Error & {
              code?: string;
            };
            error.code = 'P2002';
            throw error;
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
            include?.roomTypes ? includeRoomTypes(hotel) : hotel,
          );
        },
      ),
      findMany: jest.fn(
        ({
          where,
          include,
        }: {
          where?: Partial<Pick<StoredHotel, 'merchantId' | 'status'>>;
          include?: { roomTypes?: boolean };
        } = {}) => {
          const result = hotels.filter((hotel) => {
            if (where?.merchantId !== undefined) {
              return hotel.merchantId === where.merchantId;
            }

            if (where?.status !== undefined) {
              return hotel.status === where.status;
            }

            return true;
          });

          return Promise.resolve(
            include?.roomTypes ? result.map(includeRoomTypes) : result,
          );
        },
      ),
      findUnique: jest.fn(
        ({
          where,
          include,
        }: {
          where: { id: number };
          include?: { roomTypes?: boolean };
        }) => {
          const hotel = findHotel(where);

          return Promise.resolve(
            hotel
              ? include?.roomTypes
                ? includeRoomTypes(hotel)
                : hotel
              : null,
          );
        },
      ),
      findFirst: jest.fn(
        ({
          where,
          include,
        }: {
          where?: Partial<Pick<StoredHotel, 'id' | 'merchantId'>>;
          include?: { roomTypes?: boolean };
        }) => {
          const hotel = findHotel(where);

          return Promise.resolve(
            hotel
              ? include?.roomTypes
                ? includeRoomTypes(hotel)
                : hotel
              : null,
          );
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
          include,
        }: {
          where: { id: number };
          data: HotelUpdateData;
          include?: { roomTypes?: boolean };
        }) => {
          const hotel = hotels.find((item) => item.id === where.id);
          if (!hotel) {
            throw new Error('Hotel not found');
          }

          if (data.nameEn !== undefined) {
            const existing = hotels.find(
              (item) => item.id !== where.id && item.nameEn === data.nameEn,
            );
            if (existing) {
              const error = new Error('Unique constraint failed') as Error & {
                code?: string;
              };
              error.code = 'P2002';
              throw error;
            }
          }

          Object.assign(hotel, {
            ...data,
            openedAt:
              data.openedAt !== undefined
                ? new Date(data.openedAt)
                : hotel.openedAt,
            updatedAt: new Date(),
          });

          return Promise.resolve(
            include?.roomTypes ? includeRoomTypes(hotel) : hotel,
          );
        },
      ),
    },
    roomType: {
      create: jest.fn(({ data }: { data: RoomTypeCreateData }) => {
        const now = new Date();
        const roomType = {
          id: nextRoomTypeId,
          ...data,
          price: formatMoney(data.price),
          createdAt: now,
          updatedAt: now,
        };
        nextRoomTypeId += 1;
        roomTypes.push(roomType);

        return Promise.resolve(roomType);
      }),
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
          const roomType = findRoomType(where);

          if (!roomType) {
            return Promise.resolve(null);
          }

          const hotel = hotels.find((item) => item.id === roomType.hotelId);

          return Promise.resolve(
            include?.hotel ? { ...roomType, hotel: hotel ?? null } : roomType,
          );
        },
      ),
      findFirst: jest.fn(
        ({
          where,
          include,
        }: {
          where: {
            id?: number;
            hotelId?: number;
            hotel?: { merchantId?: number };
          };
          include?: { hotel?: boolean };
        }) => {
          const roomType = findRoomType(where);

          if (!roomType) {
            return Promise.resolve(null);
          }

          const hotel = hotels.find((item) => item.id === roomType.hotelId);
          if (
            where.hotel?.merchantId !== undefined &&
            hotel?.merchantId !== where.hotel.merchantId
          ) {
            return Promise.resolve(null);
          }

          return Promise.resolve(
            include?.hotel ? { ...roomType, hotel: hotel ?? null } : roomType,
          );
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: number };
          data: RoomTypeUpdateData;
        }) => {
          const roomType = roomTypes.find((item) => item.id === where.id);
          if (!roomType) {
            throw new Error('Room type not found');
          }

          Object.assign(roomType, {
            ...data,
            price:
              data.price !== undefined
                ? formatMoney(data.price)
                : roomType.price,
            updatedAt: new Date(),
          });

          return Promise.resolve(roomType);
        },
      ),
    },
    __testing: {
      setHotelReviewState: jest.fn(
        (id: number, status: HotelStatus, rejectReason: string | null) => {
          const hotel = hotels.find((item) => item.id === id);
          if (!hotel) {
            throw new Error('Hotel not found');
          }

          hotel.status = status;
          hotel.rejectReason = rejectReason;
          hotel.updatedAt = new Date();
        },
      ),
    },
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };
}

describe('Merchant hotel management (e2e)', () => {
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

  it('allows a MERCHANT to create a hotel pending review with no reject reason and no room types', async () => {
    const merchantToken = await registerAndLogin('merchant01', Role.MERCHANT);

    await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send(firstHotelPayload)
      .expect(201)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse>;

        expect(responseBody).toMatchObject({
          code: 0,
          message: 'success',
          data: {
            id: 1,
            nameCn: firstHotelPayload.nameCn,
            nameEn: firstHotelPayload.nameEn,
            address: firstHotelPayload.address,
            starRating: firstHotelPayload.starRating,
            openedAt: firstHotelPayload.openedAt,
            status: HotelStatus.PENDING_REVIEW,
            rejectReason: null,
            roomTypes: [],
          },
        });
      });
  });

  it('does not allow a USER to create a hotel', async () => {
    const userToken = await registerAndLogin('user01', Role.USER);

    await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${userToken}`)
      .send(firstHotelPayload)
      .expect(403)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<null>;

        expect(responseBody).toMatchObject({
          code: 403,
          data: null,
        });
      });
  });

  it('allows a MERCHANT to list only their own hotels with status, reject reason, and room types', async () => {
    const firstMerchantToken = await registerAndLogin(
      'merchant01',
      Role.MERCHANT,
    );
    const secondMerchantToken = await registerAndLogin(
      'merchant02',
      Role.MERCHANT,
    );

    await createHotel(firstMerchantToken, firstHotelPayload);
    await createHotel(secondMerchantToken, secondHotelPayload);

    await request(app.getHttpServer())
      .get('/hotels/my')
      .set('Authorization', `Bearer ${firstMerchantToken}`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse[]>;

        expect(responseBody).toMatchObject({
          code: 0,
          message: 'success',
          data: [
            {
              id: 1,
              nameCn: firstHotelPayload.nameCn,
              status: HotelStatus.PENDING_REVIEW,
              rejectReason: null,
              roomTypes: [],
            },
          ],
        });
        expect(responseBody.data).toHaveLength(1);
      });
  });

  it('returns 404 when another MERCHANT edits a hotel they do not own', async () => {
    const ownerToken = await registerAndLogin('merchant01', Role.MERCHANT);
    const otherMerchantToken = await registerAndLogin(
      'merchant02',
      Role.MERCHANT,
    );
    const hotel = await createHotel(ownerToken, firstHotelPayload);

    await request(app.getHttpServer())
      .patch(`/hotels/${hotel.id}`)
      .set('Authorization', `Bearer ${otherMerchantToken}`)
      .send({
        ...firstHotelPayload,
        nameCn: 'Unauthorized Hotel Edit',
      })
      .expect(404)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<null>;

        expect(responseBody).toMatchObject({
          code: 404,
          data: null,
        });
      });
  });

  it('allows the owning MERCHANT to edit a hotel and reset it to pending review with no reject reason', async () => {
    const merchantToken = await registerAndLogin('merchant01', Role.MERCHANT);
    const hotel = await createHotel(merchantToken, firstHotelPayload);
    prismaMock.__testing.setHotelReviewState(
      hotel.id,
      HotelStatus.REJECTED,
      'Missing license document',
    );

    await request(app.getHttpServer())
      .patch(`/hotels/${hotel.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        ...firstHotelPayload,
        nameCn: 'West Lake Hotel Phase 2',
        starRating: 4,
      })
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse>;

        expect(responseBody).toMatchObject({
          code: 0,
          message: 'success',
          data: {
            id: hotel.id,
            nameCn: 'West Lake Hotel Phase 2',
            starRating: 4,
            status: HotelStatus.PENDING_REVIEW,
            rejectReason: null,
            roomTypes: [],
          },
        });
      });
  });

  it('returns 409 when a MERCHANT creates or edits a hotel with a duplicate English name', async () => {
    const merchantToken = await registerAndLogin('merchant01', Role.MERCHANT);
    const firstHotel = await createHotel(merchantToken, firstHotelPayload);
    const secondHotel = await createHotel(merchantToken, {
      ...secondHotelPayload,
      nameEn: 'Unique Boutique Hotel',
    });

    await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        ...secondHotelPayload,
        nameEn: firstHotelPayload.nameEn,
      })
      .expect(409)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<null>;

        expect(responseBody).toMatchObject({
          code: 409,
          data: null,
        });
      });

    await request(app.getHttpServer())
      .patch(`/hotels/${secondHotel.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        ...secondHotelPayload,
        nameEn: firstHotel.nameEn,
      })
      .expect(409)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<null>;

        expect(responseBody).toMatchObject({
          code: 409,
          data: null,
        });
      });
  });

  it('returns 400 for null and empty hotel update payloads', async () => {
    const merchantToken = await registerAndLogin('merchant01', Role.MERCHANT);
    const hotel = await createHotel(merchantToken, firstHotelPayload);

    await request(app.getHttpServer())
      .patch(`/hotels/${hotel.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .set('Content-Type', 'application/json')
      .send('null')
      .expect(400)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<null>;

        expect(responseBody).toMatchObject({
          code: 400,
          data: null,
        });
      });

    await request(app.getHttpServer())
      .patch(`/hotels/${hotel.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({})
      .expect(400)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<null>;

        expect(responseBody).toMatchObject({
          code: 400,
          data: null,
        });
      });
  });

  it('trims blank facilities when a MERCHANT sends facilities as an array', async () => {
    const merchantToken = await registerAndLogin('merchant01', Role.MERCHANT);

    await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        ...firstHotelPayload,
        facilities: [' wifi ', '', '  ', 'parking'],
      })
      .expect(201)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<HotelResponse>;

        expect(responseBody.data.facilities).toEqual(['wifi', 'parking']);
      });
  });

  it('allows a MERCHANT to create and edit room types under their own hotel', async () => {
    const merchantToken = await registerAndLogin('merchant01', Role.MERCHANT);
    const hotel = await createHotel(merchantToken, firstHotelPayload);

    const createResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        hotelId: hotel.id,
        name: 'Deluxe King',
        price: 888,
      })
      .expect(201);

    const createBody = createResponse.body as ApiEnvelope<RoomTypeResponse>;
    expect(createBody).toMatchObject({
      code: 0,
      message: 'success',
      data: {
        id: 1,
        hotelId: hotel.id,
        name: 'Deluxe King',
        price: '888.00',
      },
    });

    await request(app.getHttpServer())
      .patch(`/rooms/${createBody.data.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Executive King',
        price: 988,
      })
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<RoomTypeResponse>;

        expect(responseBody).toMatchObject({
          code: 0,
          message: 'success',
          data: {
            id: createBody.data.id,
            hotelId: hotel.id,
            name: 'Executive King',
            price: '988.00',
          },
        });
      });
  });

  it('returns 404 when another MERCHANT creates or edits room types for hotels and rooms they do not own', async () => {
    const ownerToken = await registerAndLogin('merchant01', Role.MERCHANT);
    const otherMerchantToken = await registerAndLogin(
      'merchant02',
      Role.MERCHANT,
    );
    const hotel = await createHotel(ownerToken, firstHotelPayload);
    const roomType = await createRoomType(ownerToken, {
      hotelId: hotel.id,
      name: 'Deluxe King',
      price: 888,
    });

    await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${otherMerchantToken}`)
      .send({
        hotelId: hotel.id,
        name: 'Unauthorized Twin',
        price: 688,
      })
      .expect(404)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<null>;

        expect(responseBody).toMatchObject({
          code: 404,
          data: null,
        });
      });

    await request(app.getHttpServer())
      .patch(`/rooms/${roomType.id}`)
      .set('Authorization', `Bearer ${otherMerchantToken}`)
      .send({
        name: 'Unauthorized Edit',
        price: 588,
      })
      .expect(404)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<null>;

        expect(responseBody).toMatchObject({
          code: 404,
          data: null,
        });
      });
  });

  it('returns 400 for invalid hotel payloads and invalid room payloads', async () => {
    const merchantToken = await registerAndLogin('merchant01', Role.MERCHANT);
    const hotel = await createHotel(merchantToken, firstHotelPayload);

    await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        ...firstHotelPayload,
        nameCn: '',
      })
      .expect(400)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<null>;

        expect(responseBody).toMatchObject({
          code: 400,
          data: null,
        });
      });

    await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        hotelId: hotel.id,
        name: '',
        price: 0,
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

  async function registerAndLogin(username: string, role: Role) {
    await request(app.getHttpServer()).post('/auth/register').send({
      username,
      password: 'password123456',
      role,
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username,
        password: 'password123456',
      })
      .expect(201);

    const loginBody = loginResponse.body as ApiEnvelope<LoginBody>;
    return loginBody.data.token;
  }

  async function createHotel(
    token: string,
    payload: typeof firstHotelPayload | typeof secondHotelPayload,
  ) {
    const response = await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return (response.body as ApiEnvelope<HotelResponse>).data;
  }

  async function createRoomType(
    token: string,
    payload: { hotelId: number } & RoomTypePayload,
  ) {
    const response = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return (response.body as ApiEnvelope<RoomTypeResponse>).data;
  }
});

function formatMoney(value: number | string) {
  return Number(value).toFixed(2);
}
