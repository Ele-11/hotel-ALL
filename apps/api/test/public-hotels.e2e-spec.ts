import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HotelStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

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

type PublicHotelListItem = {
  id: number;
  nameCn: string;
  address: string;
  starRating: number;
  imageUrl: string | null;
  minPrice: string | null;
};

type PublicHotelListResponse = {
  items: PublicHotelListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type PublicHotelDetail = {
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

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

const publishedHotel = {
  nameCn: 'West Lake Suites',
  nameEn: 'West Lake Suites',
  address: 'Hangzhou West Lake Scenic Area',
  starRating: 5,
  openedAt: '2020-01-01T00:00:00.000Z',
  imageUrl: null,
  facilities: ['wifi', 'gym'],
  status: HotelStatus.PUBLISHED,
  rejectReason: null,
  merchantId: 1,
};

const offlineHotel = {
  nameCn: 'Bund Hidden Hotel',
  nameEn: 'Bund Hidden Hotel',
  address: 'Shanghai The Bund',
  starRating: 4,
  openedAt: '2021-06-01T00:00:00.000Z',
  imageUrl: 'https://example.com/bund.jpg',
  facilities: ['wifi'],
  status: HotelStatus.OFFLINE,
  rejectReason: null,
  merchantId: 2,
};

const approvedHotel = {
  nameCn: 'Guangzhou Approved Hotel',
  nameEn: 'Guangzhou Approved Hotel',
  address: 'Guangzhou Tianhe',
  starRating: 4,
  openedAt: '2022-04-01T00:00:00.000Z',
  imageUrl: null,
  facilities: ['parking'],
  status: HotelStatus.APPROVED,
  rejectReason: null,
  merchantId: 3,
};

function createPrismaMock() {
  const hotels: StoredHotel[] = [];
  const roomTypes: StoredRoomType[] = [];
  let nextHotelId = 1;
  let nextRoomTypeId = 1;

  const prismaMock = {
    hotel: {
      findMany: jest.fn(
        ({
          where,
          include,
        }: {
          where?: {
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
            if (where?.status && hotel.status !== where.status) {
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

          if (!include?.roomTypes) {
            return Promise.resolve(result);
          }

          return Promise.resolve(
            result.map((hotel) => ({
              ...hotel,
              roomTypes: roomTypes
                .filter((roomType) => roomType.hotelId === hotel.id)
                .sort(
                  (left, right) => Number(left.price) - Number(right.price),
                ),
            })),
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
            status?: HotelStatus;
          };
          include?: { roomTypes?: boolean };
        }) => {
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

          if (!hotel) {
            return Promise.resolve(null);
          }

          if (!include?.roomTypes) {
            return Promise.resolve(hotel);
          }

          return Promise.resolve({
            ...hotel,
            roomTypes: roomTypes
              .filter((roomType) => roomType.hotelId === hotel.id)
              .sort((left, right) => Number(left.price) - Number(right.price)),
          });
        },
      ),
    },
    roomType: {
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
    },
  };

  return prismaMock;
}

describe('Public hotels (e2e)', () => {
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

  it('lists only published hotels, applies keyword and city filters, and paginates', async () => {
    const firstPublished = prismaMock.__testing.createHotel(publishedHotel);
    prismaMock.__testing.createHotel(offlineHotel);
    prismaMock.__testing.createHotel(approvedHotel);
    const secondPublished = prismaMock.__testing.createHotel({
      ...publishedHotel,
      nameCn: 'Shanghai Riverside Hotel',
      nameEn: 'Shanghai Riverside Hotel',
      address: 'Shanghai Pudong Riverside',
      merchantId: 4,
    });

    prismaMock.__testing.createRoomType({
      hotelId: firstPublished.id,
      name: 'Deluxe King',
      price: 699,
    });
    prismaMock.__testing.createRoomType({
      hotelId: firstPublished.id,
      name: 'Executive Suite',
      price: 899,
    });
    prismaMock.__testing.createRoomType({
      hotelId: secondPublished.id,
      name: 'City View Queen',
      price: 799,
    });

    await request(app.getHttpServer())
      .get('/hotels?keyword=West&page=1&pageSize=1')
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<PublicHotelListResponse>;

        expect(responseBody.code).toBe(0);
        expect(responseBody.data.total).toBe(1);
        expect(responseBody.data.totalPages).toBe(1);
        expect(responseBody.data.items).toEqual([
          expect.objectContaining({
            id: firstPublished.id,
            nameCn: firstPublished.nameCn,
            minPrice: '699.00',
            imageUrl: null,
          }),
        ]);
      });

    await request(app.getHttpServer())
      .get('/hotels?city=Shanghai')
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<PublicHotelListResponse>;

        expect(responseBody.data.items).toEqual([
          expect.objectContaining({
            id: secondPublished.id,
            address: secondPublished.address,
          }),
        ]);
      });
  });

  it('returns published hotel details with nights and rooms sorted by price', async () => {
    const hotel = prismaMock.__testing.createHotel(publishedHotel);

    const secondRoom = prismaMock.__testing.createRoomType({
      hotelId: hotel.id,
      name: 'Executive Suite',
      price: 988,
    });
    const firstRoom = prismaMock.__testing.createRoomType({
      hotelId: hotel.id,
      name: 'Deluxe King',
      price: 688,
    });

    await request(app.getHttpServer())
      .get(`/hotels/${hotel.id}?checkInDate=2026-06-10&checkOutDate=2026-06-12`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<PublicHotelDetail>;

        expect(responseBody.data).toMatchObject({
          id: hotel.id,
          nameCn: hotel.nameCn,
          checkInDate: '2026-06-10',
          checkOutDate: '2026-06-12',
          nights: 2,
        });
        expect(responseBody.data.roomTypes).toEqual([
          expect.objectContaining({ id: firstRoom.id, price: '688.00' }),
          expect.objectContaining({ id: secondRoom.id, price: '988.00' }),
        ]);
      });
  });

  it('does not expose offline or approved hotels in detail or room queries', async () => {
    const offline = prismaMock.__testing.createHotel(offlineHotel);
    const approved = prismaMock.__testing.createHotel(approvedHotel);

    prismaMock.__testing.createRoomType({
      hotelId: offline.id,
      name: 'Offline Room',
      price: 588,
    });
    prismaMock.__testing.createRoomType({
      hotelId: approved.id,
      name: 'Approved Room',
      price: 488,
    });

    await request(app.getHttpServer()).get(`/hotels/${offline.id}`).expect(404);
    await request(app.getHttpServer())
      .get(`/hotels/${approved.id}`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/hotels/${offline.id}/rooms`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/hotels/${approved.id}/rooms`)
      .expect(404);
  });

  it('returns published hotel rooms sorted by price', async () => {
    const hotel = prismaMock.__testing.createHotel(publishedHotel);

    const expensiveRoom = prismaMock.__testing.createRoomType({
      hotelId: hotel.id,
      name: 'Lake View Suite',
      price: 1288,
    });
    const cheapRoom = prismaMock.__testing.createRoomType({
      hotelId: hotel.id,
      name: 'Standard Queen',
      price: 588,
    });

    await request(app.getHttpServer())
      .get(`/hotels/${hotel.id}/rooms`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as ApiEnvelope<
          PublicHotelDetail['roomTypes']
        >;

        expect(responseBody.data).toEqual([
          expect.objectContaining({ id: cheapRoom.id, price: '588.00' }),
          expect.objectContaining({ id: expensiveRoom.id, price: '1288.00' }),
        ]);
      });
  });
});
