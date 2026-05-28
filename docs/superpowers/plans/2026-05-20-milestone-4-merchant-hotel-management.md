# Milestone 4 Merchant Hotel Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让商户可以创建、编辑自己名下的酒店，维护自己酒店的房型和价格，并查看审核状态和驳回原因。

**Architecture:** 后端新增 `HotelsModule` 和 `RoomsModule`，复用 Milestone 3 的 `AuthGuard`、`RolesGuard`、`CurrentUser` 和 Prisma 模型，所有商户写操作都绑定 `merchantId` 并把酒店状态重置为 `PENDING_REVIEW`。前端在现有登录页基础上增加商户后台工作区，商户登录后直接管理自己的酒店和房型；普通用户和管理员仍只展示角色入口，不提前实现后续里程碑。

**Tech Stack:** Nest.js, TypeScript, Prisma, PostgreSQL, React 18, Tailwind CSS, Axios, Zustand.

---

## Scope Notes

- 只实现 Milestone 4 和 `docs/API.md` 中已列出的商户接口：`GET /hotels/my`、`POST /hotels`、`PATCH /hotels/:id`、`POST /rooms`、`PATCH /rooms/:id`。
- 不实现 Milestone 5 的管理员审核、发布、下线接口。
- 不实现 Milestone 6 的用户端酒店查询、列表、详情接口。
- 不新增删除房型接口，因为 API 文档未定义删除能力。
- `GET /hotels/my` 返回商户酒店列表、审核状态、驳回原因，并带上 `roomTypes`，用于商户后台展示已有房型；这是在文档定义的“商户自己创建的酒店列表”内补充必要展示字段，不新增新路由。
- 按 `AGENTS.md`，执行实现前先同步远程最新代码，并创建 Milestone 分支；当前计划文件本身不执行分支切换。
- 前端 UI 执行时必须读取 `.agents/skills/ele-ui/Skill.md`，并保持管理端 PC 后台风格。

## File Structure

- Create: `apps/api/src/hotels/dto/hotel.dto.ts`  
  定义创建和编辑酒店请求类型。
- Create: `apps/api/src/hotels/hotels.service.ts`  
  负责商户酒店列表、创建、编辑、字段校验、所有权校验和响应序列化。
- Create: `apps/api/src/hotels/hotels.controller.ts`  
  暴露 `GET /hotels/my`、`POST /hotels`、`PATCH /hotels/:id`，统一包裹 `{ code, message, data }`。
- Create: `apps/api/src/hotels/hotels.module.ts`  
  组装酒店控制器和服务，导入 `PrismaModule`、`AuthModule`。
- Create: `apps/api/src/rooms/dto/room.dto.ts`  
  定义创建和编辑房型请求类型。
- Create: `apps/api/src/rooms/rooms.service.ts`  
  负责房型创建、编辑、价格校验、酒店归属校验，并在房型变更后把酒店状态重置为待审核。
- Create: `apps/api/src/rooms/rooms.controller.ts`  
  暴露 `POST /rooms`、`PATCH /rooms/:id`。
- Create: `apps/api/src/rooms/rooms.module.ts`  
  组装房型控制器和服务，导入 `PrismaModule`、`AuthModule`。
- Modify: `apps/api/src/app.module.ts`  
  注册 `HotelsModule` 和 `RoomsModule`。
- Create: `apps/api/test/merchant-management.e2e-spec.ts`  
  覆盖商户酒店与房型接口、角色限制、所有权限制和待审核状态。
- Create: `apps/web/src/types/merchant.ts`  
  定义商户酒店、房型、状态和表单输入类型。
- Modify: `apps/web/src/lib/api.ts`  
  增加商户酒店与房型 API 调用函数。
- Create: `apps/web/src/components/MerchantHotelManager.tsx`  
  商户后台页面，包含酒店表单、酒店列表、房型表单、审核状态和驳回原因展示。
- Modify: `apps/web/src/App.tsx`  
  商户登录后展示 `MerchantHotelManager`，其他角色保持 Milestone 3 的角色入口。

---

### Task 0: Branch And Workspace Preparation

**Files:**
- No source files changed in this task

- [ ] **Step 1: Check current status**

Run:

```bash
git status --short
```

Expected: Review existing user changes. Do not revert `AGENTS.md` or unrelated files.

- [ ] **Step 2: Sync remote**

Run:

```bash
git fetch origin
```

Expected: Fetch completes without merge conflicts.

- [ ] **Step 3: Start the Milestone branch**

Run:

```bash
git switch -c codex/milestone-4-merchant-hotels
```

Expected: New branch `codex/milestone-4-merchant-hotels` is active. If the branch already exists, use `git switch codex/milestone-4-merchant-hotels`.

- [ ] **Step 4: Confirm branch**

Run:

```bash
git branch --show-current
```

Expected: Output is `codex/milestone-4-merchant-hotels`.

---

### Task 1: Backend Merchant Management E2E Tests

**Files:**
- Create: `apps/api/test/merchant-management.e2e-spec.ts`

- [ ] **Step 1: Write failing e2e coverage**

Create `apps/api/test/merchant-management.e2e-spec.ts` with this full content:

```ts
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

type HotelBody = {
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
  roomTypes: RoomBody[];
};

type RoomBody = {
  id: number;
  hotelId: number;
  name: string;
  price: string;
};

function createPrismaMock() {
  const users: StoredUser[] = [];
  const hotels: StoredHotel[] = [];
  const roomTypes: StoredRoomType[] = [];
  let nextUserId = 1;
  let nextHotelId = 1;
  let nextRoomTypeId = 1;

  function uniqueError() {
    const error = new Error('Unique constraint failed') as Error & {
      code?: string;
    };
    error.code = 'P2002';
    return error;
  }

  function withRoomTypes(hotel: StoredHotel) {
    return {
      ...hotel,
      roomTypes: roomTypes
        .filter((roomType) => roomType.hotelId === hotel.id)
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime()),
    };
  }

  return {
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
      create: jest.fn(({ data }: { data: Omit<StoredHotel, 'id' | 'createdAt' | 'updatedAt'> }) => {
        if (hotels.some((hotel) => hotel.nameEn === data.nameEn)) {
          throw uniqueError();
        }

        const now = new Date();
        const hotel = {
          id: nextHotelId,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        nextHotelId += 1;
        hotels.push(hotel);
        return Promise.resolve(hotel);
      }),
      findMany: jest.fn(({ where }: { where: { merchantId?: number } }) => {
        const result = hotels
          .filter((hotel) => where.merchantId === undefined || hotel.merchantId === where.merchantId)
          .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
          .map(withRoomTypes);

        return Promise.resolve(result);
      }),
      findFirst: jest.fn(({ where }: { where: { id?: number; merchantId?: number } }) => {
        const hotel =
          hotels.find(
            (item) =>
              (where.id === undefined || item.id === where.id) &&
              (where.merchantId === undefined || item.merchantId === where.merchantId),
          ) ?? null;

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
          include?: { roomTypes?: unknown };
        }) => {
        const hotel = hotels.find((item) => item.id === where.id);

        if (!hotel) {
          throw new Error('Hotel not found');
        }

        if (
          data.nameEn !== undefined &&
          hotels.some((item) => item.id !== hotel.id && item.nameEn === data.nameEn)
        ) {
          throw uniqueError();
        }

        Object.assign(hotel, data, { updatedAt: new Date() });
        return Promise.resolve(include?.roomTypes ? withRoomTypes(hotel) : hotel);
      },
      ),
    },
    roomType: {
      create: jest.fn(({ data }: { data: Omit<StoredRoomType, 'id' | 'createdAt' | 'updatedAt'> }) => {
        if (
          roomTypes.some(
            (roomType) => roomType.hotelId === data.hotelId && roomType.name === data.name,
          )
        ) {
          throw uniqueError();
        }

        const now = new Date();
        const roomType = {
          id: nextRoomTypeId,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        nextRoomTypeId += 1;
        roomTypes.push(roomType);
        return Promise.resolve(roomType);
      }),
      findUnique: jest.fn(({ where }: { where: { id: number } }) => {
        const roomType = roomTypes.find((item) => item.id === where.id);
        const hotel = roomType
          ? hotels.find((item) => item.id === roomType.hotelId)
          : undefined;

        return Promise.resolve(
          roomType && hotel
            ? {
                ...roomType,
                hotel,
              }
            : null,
        );
      }),
      update: jest.fn(({ where, data }: { where: { id: number }; data: Partial<StoredRoomType> }) => {
        const roomType = roomTypes.find((item) => item.id === where.id);

        if (!roomType) {
          throw new Error('Room type not found');
        }

        if (
          data.name !== undefined &&
          roomTypes.some(
            (item) =>
              item.id !== roomType.id &&
              item.hotelId === roomType.hotelId &&
              item.name === data.name,
          )
        ) {
          throw uniqueError();
        }

        Object.assign(roomType, data, { updatedAt: new Date() });
        return Promise.resolve(roomType);
      }),
    },
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };
}

async function registerAndLogin(
  app: INestApplication<App>,
  input: { username: string; password: string; role: Role.USER | Role.MERCHANT },
) {
  await request(app.getHttpServer()).post('/auth/register').send(input).expect(201);

  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      username: input.username,
      password: input.password,
    })
    .expect(201);

  return (response.body as ApiEnvelope<LoginBody>).data.token;
}

const hotelInput = {
  nameCn: '商户测试酒店',
  nameEn: 'Merchant Test Hotel',
  address: '上海市黄浦区测试路 1 号',
  starRating: 5,
  openedAt: '2024-01-01',
  imageUrl: '',
  facilities: ['WiFi', '停车场'],
};

describe('Merchant hotel management (e2e)', () => {
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

  it('allows a merchant to create, list, and edit only their own hotel', async () => {
    const merchantToken = await registerAndLogin(app, {
      username: 'merchant01',
      password: 'merchant123456',
      role: Role.MERCHANT,
    });
    const otherMerchantToken = await registerAndLogin(app, {
      username: 'merchant02',
      password: 'merchant123456',
      role: Role.MERCHANT,
    });
    const userToken = await registerAndLogin(app, {
      username: 'user01',
      password: 'user123456',
      role: Role.USER,
    });

    const createResponse = await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send(hotelInput)
      .expect(201);

    const createdHotel = (createResponse.body as ApiEnvelope<HotelBody>).data;

    expect(createdHotel).toMatchObject({
      nameCn: '商户测试酒店',
      nameEn: 'Merchant Test Hotel',
      status: HotelStatus.PENDING_REVIEW,
      rejectReason: null,
      roomTypes: [],
    });

    await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${userToken}`)
      .send(hotelInput)
      .expect(403);

    const listResponse = await request(app.getHttpServer())
      .get('/hotels/my')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    const myHotels = (listResponse.body as ApiEnvelope<HotelBody[]>).data;

    expect(myHotels).toHaveLength(1);
    expect(myHotels[0]).toMatchObject({
      id: createdHotel.id,
      status: HotelStatus.PENDING_REVIEW,
      rejectReason: null,
    });

    await request(app.getHttpServer())
      .patch(`/hotels/${createdHotel.id}`)
      .set('Authorization', `Bearer ${otherMerchantToken}`)
      .send({
        ...hotelInput,
        nameCn: '越权编辑酒店',
      })
      .expect(404);

    const patchResponse = await request(app.getHttpServer())
      .patch(`/hotels/${createdHotel.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        ...hotelInput,
        nameCn: '编辑后的商户测试酒店',
        imageUrl: 'https://example.com/hotel.jpg',
      })
      .expect(200);

    const patchedHotel = (patchResponse.body as ApiEnvelope<HotelBody>).data;

    expect(patchedHotel).toMatchObject({
      id: createdHotel.id,
      nameCn: '编辑后的商户测试酒店',
      status: HotelStatus.PENDING_REVIEW,
      rejectReason: null,
    });
  });

  it('allows a merchant to create and edit room types only under their own hotels', async () => {
    const merchantToken = await registerAndLogin(app, {
      username: 'merchant01',
      password: 'merchant123456',
      role: Role.MERCHANT,
    });
    const otherMerchantToken = await registerAndLogin(app, {
      username: 'merchant02',
      password: 'merchant123456',
      role: Role.MERCHANT,
    });

    const hotelResponse = await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send(hotelInput)
      .expect(201);

    const hotel = (hotelResponse.body as ApiEnvelope<HotelBody>).data;

    await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${otherMerchantToken}`)
      .send({
        hotelId: hotel.id,
        name: '越权房型',
        price: 299,
      })
      .expect(404);

    const roomResponse = await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        hotelId: hotel.id,
        name: '高级大床房',
        price: 399,
      })
      .expect(201);

    const room = (roomResponse.body as ApiEnvelope<RoomBody>).data;

    expect(room).toMatchObject({
      hotelId: hotel.id,
      name: '高级大床房',
      price: '399.00',
    });

    await request(app.getHttpServer())
      .patch(`/rooms/${room.id}`)
      .set('Authorization', `Bearer ${otherMerchantToken}`)
      .send({
        name: '越权编辑房型',
        price: 499,
      })
      .expect(404);

    const patchResponse = await request(app.getHttpServer())
      .patch(`/rooms/${room.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: '豪华大床房',
        price: '459.5',
      })
      .expect(200);

    const patchedRoom = (patchResponse.body as ApiEnvelope<RoomBody>).data;

    expect(patchedRoom).toMatchObject({
      id: room.id,
      hotelId: hotel.id,
      name: '豪华大床房',
      price: '459.50',
    });

    const listResponse = await request(app.getHttpServer())
      .get('/hotels/my')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    const hotels = (listResponse.body as ApiEnvelope<HotelBody[]>).data;

    expect(hotels[0].roomTypes).toEqual([
      expect.objectContaining({
        id: room.id,
        name: '豪华大床房',
        price: '459.50',
      }),
    ]);
  });

  it('rejects invalid merchant hotel and room payloads', async () => {
    const merchantToken = await registerAndLogin(app, {
      username: 'merchant01',
      password: 'merchant123456',
      role: Role.MERCHANT,
    });

    await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        ...hotelInput,
        nameCn: '',
      })
      .expect(400);

    const hotelResponse = await request(app.getHttpServer())
      .post('/hotels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send(hotelInput)
      .expect(201);

    const hotel = (hotelResponse.body as ApiEnvelope<HotelBody>).data;

    await request(app.getHttpServer())
      .post('/rooms')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        hotelId: hotel.id,
        name: '',
        price: -1,
      })
      .expect(400);
  });
});
```

- [ ] **Step 2: Run the focused e2e tests and confirm they fail**

Run:

```bash
pnpm --filter @hotel/api test:e2e -- merchant-management.e2e-spec.ts
```

Expected: FAIL because `HotelsModule` and `RoomsModule` routes do not exist.

- [ ] **Step 3: Commit the failing tests**

Run:

```bash
git add apps/api/test/merchant-management.e2e-spec.ts
git commit -m "test: cover merchant hotel management"
```

Expected: Commit succeeds with only the new e2e test file staged.

---

### Task 2: Backend Hotel API

**Files:**
- Create: `apps/api/src/hotels/dto/hotel.dto.ts`
- Create: `apps/api/src/hotels/hotels.service.ts`
- Create: `apps/api/src/hotels/hotels.controller.ts`
- Create: `apps/api/src/hotels/hotels.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create hotel DTO types**

Create `apps/api/src/hotels/dto/hotel.dto.ts`:

```ts
export type HotelDto = {
  nameCn?: string;
  nameEn?: string;
  address?: string;
  starRating?: number | string;
  openedAt?: string;
  imageUrl?: string | null;
  facilities?: string[] | string | null;
};
```

- [ ] **Step 2: Create hotel service**

Create `apps/api/src/hotels/hotels.service.ts`:

```ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HotelStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { HotelDto } from './dto/hotel.dto';

type HotelWithRooms = Prisma.HotelGetPayload<{
  include: {
    roomTypes: true;
  };
}>;

@Injectable()
export class HotelsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyHotels(merchantId: number) {
    const hotels = await this.prisma.hotel.findMany({
      where: { merchantId },
      include: {
        roomTypes: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return hotels.map(toHotelResponse);
  }

  async createHotel(merchantId: number, dto: HotelDto) {
    const data = normalizeHotelInput(dto);

    try {
      const hotel = await this.prisma.hotel.create({
        data: {
          ...data,
          status: HotelStatus.PENDING_REVIEW,
          rejectReason: null,
          merchantId,
        },
      });

      return toHotelResponse({ ...hotel, roomTypes: [] });
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Hotel English name already exists');
      }

      throw error;
    }
  }

  async updateHotel(merchantId: number, hotelId: number, dto: HotelDto) {
    const normalizedHotelId = normalizeId(hotelId, 'Hotel ID is required');
    const existingHotel = await this.prisma.hotel.findFirst({
      where: {
        id: normalizedHotelId,
        merchantId,
      },
    });

    if (!existingHotel) {
      throw new NotFoundException('Hotel not found');
    }

    const data = normalizeHotelInput(dto);

    try {
      const hotel = await this.prisma.hotel.update({
        where: { id: normalizedHotelId },
        data: {
          ...data,
          status: HotelStatus.PENDING_REVIEW,
          rejectReason: null,
        },
        include: {
          roomTypes: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return toHotelResponse(hotel);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Hotel English name already exists');
      }

      throw error;
    }
  }
}

function normalizeHotelInput(dto: HotelDto) {
  return {
    nameCn: requiredString(dto.nameCn, 'Hotel Chinese name is required'),
    nameEn: requiredString(dto.nameEn, 'Hotel English name is required'),
    address: requiredString(dto.address, 'Hotel address is required'),
    starRating: normalizeStarRating(dto.starRating),
    openedAt: normalizeOpenedAt(dto.openedAt),
    imageUrl: normalizeOptionalString(dto.imageUrl),
    facilities: normalizeFacilities(dto.facilities),
  };
}

function requiredString(value: string | undefined, message: string) {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    throw new BadRequestException(message);
  }

  return normalized;
}

function normalizeOptionalString(value: string | null | undefined) {
  const normalized = value?.trim() ?? '';
  return normalized || null;
}

function normalizeFacilities(value: string[] | string | null | undefined) {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(value)) {
    throw new BadRequestException('Facilities must be a string array');
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

function normalizeStarRating(value: number | string | undefined) {
  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new BadRequestException('Hotel star rating must be an integer from 1 to 5');
  }

  return rating;
}

function normalizeId(value: number | string | undefined, message: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException(message);
  }

  return id;
}

function normalizeOpenedAt(value: string | undefined) {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    throw new BadRequestException('Hotel opened date is required');
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Hotel opened date is invalid');
  }

  return date;
}

function toHotelResponse(hotel: HotelWithRooms) {
  return {
    id: hotel.id,
    nameCn: hotel.nameCn,
    nameEn: hotel.nameEn,
    address: hotel.address,
    starRating: hotel.starRating,
    openedAt: hotel.openedAt.toISOString(),
    imageUrl: hotel.imageUrl,
    facilities: hotel.facilities,
    status: hotel.status,
    rejectReason: hotel.rejectReason,
    merchantId: hotel.merchantId,
    roomTypes: hotel.roomTypes.map((roomType) => ({
      id: roomType.id,
      hotelId: roomType.hotelId,
      name: roomType.name,
      price: roomType.price.toString(),
      createdAt: roomType.createdAt.toISOString(),
      updatedAt: roomType.updatedAt.toISOString(),
    })),
    createdAt: hotel.createdAt.toISOString(),
    updatedAt: hotel.updatedAt.toISOString(),
  };
}

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
```

- [ ] **Step 3: Create hotel controller**

Create `apps/api/src/hotels/hotels.controller.ts`:

```ts
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { HotelDto } from './dto/hotel.dto';
import { HotelsService } from './hotels.service';

@Controller('hotels')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get('my')
  async listMyHotels(@CurrentUser() currentUser: CurrentUserType) {
    return success(await this.hotelsService.listMyHotels(currentUser.id));
  }

  @Post()
  async createHotel(
    @CurrentUser() currentUser: CurrentUserType,
    @Body() dto: HotelDto,
  ) {
    return success(await this.hotelsService.createHotel(currentUser.id, dto));
  }

  @Patch(':id')
  async updateHotel(
    @CurrentUser() currentUser: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: HotelDto,
  ) {
    return success(
      await this.hotelsService.updateHotel(currentUser.id, Number(id), dto),
    );
  }
}

function success<T>(data: T) {
  return {
    code: 0,
    message: 'success',
    data,
  };
}
```

- [ ] **Step 4: Create hotel module**

Create `apps/api/src/hotels/hotels.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [HotelsController],
  providers: [HotelsService],
  exports: [HotelsService],
})
export class HotelsModule {}
```

- [ ] **Step 5: Register hotel module**

Modify `apps/api/src/app.module.ts` so the imports include `HotelsModule`:

```ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { HotelsModule } from './hotels/hotels.module';

@Module({
  imports: [AuthModule, HotelsModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @hotel/api test:e2e -- merchant-management.e2e-spec.ts
```

Expected: Hotel route assertions pass, room route assertions still fail because `/rooms` is not implemented.

---

### Task 3: Backend Room API

**Files:**
- Create: `apps/api/src/rooms/dto/room.dto.ts`
- Create: `apps/api/src/rooms/rooms.service.ts`
- Create: `apps/api/src/rooms/rooms.controller.ts`
- Create: `apps/api/src/rooms/rooms.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create room DTO types**

Create `apps/api/src/rooms/dto/room.dto.ts`:

```ts
export type CreateRoomDto = {
  hotelId?: number | string;
  name?: string;
  price?: number | string;
};

export type UpdateRoomDto = {
  name?: string;
  price?: number | string;
};
```

- [ ] **Step 2: Create room service**

Create `apps/api/src/rooms/rooms.service.ts`:

```ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HotelStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(merchantId: number, dto: CreateRoomDto) {
    const hotelId = normalizeId(dto.hotelId, 'Hotel ID is required');
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        merchantId,
      },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    try {
      const roomType = await this.prisma.roomType.create({
        data: {
          hotelId,
          name: requiredString(dto.name, 'Room type name is required'),
          price: normalizePrice(dto.price),
        },
      });

      await this.markHotelPendingReview(hotelId);

      return toRoomResponse(roomType);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Room type name already exists in this hotel');
      }

      throw error;
    }
  }

  async updateRoom(merchantId: number, roomId: number, dto: UpdateRoomDto) {
    const existingRoom = await this.prisma.roomType.findUnique({
      where: { id: roomId },
      include: {
        hotel: true,
      },
    });

    if (!existingRoom || existingRoom.hotel.merchantId !== merchantId) {
      throw new NotFoundException('Room type not found');
    }

    try {
      const roomType = await this.prisma.roomType.update({
        where: { id: roomId },
        data: {
          name: requiredString(dto.name, 'Room type name is required'),
          price: normalizePrice(dto.price),
        },
      });

      await this.markHotelPendingReview(roomType.hotelId);

      return toRoomResponse(roomType);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Room type name already exists in this hotel');
      }

      throw error;
    }
  }

  private async markHotelPendingReview(hotelId: number) {
    await this.prisma.hotel.update({
      where: { id: hotelId },
      data: {
        status: HotelStatus.PENDING_REVIEW,
        rejectReason: null,
      },
    });
  }
}

function normalizeId(value: number | string | undefined, message: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException(message);
  }

  return id;
}

function requiredString(value: string | undefined, message: string) {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    throw new BadRequestException(message);
  }

  return normalized;
}

function normalizePrice(value: number | string | undefined) {
  const price = Number(value);

  if (!Number.isFinite(price) || price <= 0) {
    throw new BadRequestException('Room type price must be greater than 0');
  }

  return price.toFixed(2);
}

function toRoomResponse(roomType: {
  id: number;
  hotelId: number;
  name: string;
  price: { toString(): string };
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: roomType.id,
    hotelId: roomType.hotelId,
    name: roomType.name,
    price: Number(roomType.price.toString()).toFixed(2),
    createdAt: roomType.createdAt?.toISOString(),
    updatedAt: roomType.updatedAt?.toISOString(),
  };
}

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
```

- [ ] **Step 3: Create room controller**

Create `apps/api/src/rooms/rooms.controller.ts`:

```ts
import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async createRoom(
    @CurrentUser() currentUser: CurrentUserType,
    @Body() dto: CreateRoomDto,
  ) {
    return success(await this.roomsService.createRoom(currentUser.id, dto));
  }

  @Patch(':id')
  async updateRoom(
    @CurrentUser() currentUser: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return success(await this.roomsService.updateRoom(currentUser.id, Number(id), dto));
  }
}

function success<T>(data: T) {
  return {
    code: 0,
    message: 'success',
    data,
  };
}
```

- [ ] **Step 4: Create room module**

Create `apps/api/src/rooms/rooms.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
```

- [ ] **Step 5: Register room module**

Modify `apps/api/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { HotelsModule } from './hotels/hotels.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [AuthModule, HotelsModule, RoomsModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Run focused e2e tests**

Run:

```bash
pnpm --filter @hotel/api test:e2e -- merchant-management.e2e-spec.ts
```

Expected: PASS for merchant hotel and room management tests.

- [ ] **Step 7: Run backend typecheck and test**

Run:

```bash
pnpm --filter @hotel/api typecheck
```

Expected: PASS.

Run:

```bash
pnpm --filter @hotel/api test
```

Expected: PASS.

- [ ] **Step 8: Commit backend implementation**

Run:

```bash
git add apps/api/src/app.module.ts apps/api/src/hotels apps/api/src/rooms
git commit -m "feat: add merchant hotel management api"
```

Expected: Commit succeeds with only backend implementation files staged.

---

### Task 4: Frontend API Types And Client Methods

**Files:**
- Create: `apps/web/src/types/merchant.ts`
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Create merchant types**

Create `apps/web/src/types/merchant.ts`:

```ts
export type HotelStatus =
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'OFFLINE'

export type MerchantRoomType = {
  id: number
  hotelId: number
  name: string
  price: string
  createdAt?: string
  updatedAt?: string
}

export type MerchantHotel = {
  id: number
  nameCn: string
  nameEn: string
  address: string
  starRating: number
  openedAt: string
  imageUrl: string | null
  facilities: string[]
  status: HotelStatus
  rejectReason: string | null
  merchantId: number
  roomTypes: MerchantRoomType[]
  createdAt: string
  updatedAt: string
}

export type HotelFormInput = {
  nameCn: string
  nameEn: string
  address: string
  starRating: string
  openedAt: string
  imageUrl: string
  facilities: string
}

export type RoomFormInput = {
  name: string
  price: string
}
```

- [ ] **Step 2: Add merchant API client functions**

Modify `apps/web/src/lib/api.ts` by adding these imports:

```ts
import type {
  HotelFormInput,
  MerchantHotel,
  MerchantRoomType,
  RoomFormInput,
} from '../types/merchant'
```

Append these functions below `getCurrentUser()`:

```ts
export async function getMyHotels() {
  const response =
    await apiClient.get<ApiResponse<MerchantHotel[]>>('/hotels/my')
  return response.data.data
}

export async function createMerchantHotel(input: HotelFormInput) {
  const response = await apiClient.post<ApiResponse<MerchantHotel>>(
    '/hotels',
    toHotelPayload(input),
  )
  return response.data.data
}

export async function updateMerchantHotel(id: number, input: HotelFormInput) {
  const response = await apiClient.patch<ApiResponse<MerchantHotel>>(
    `/hotels/${id}`,
    toHotelPayload(input),
  )
  return response.data.data
}

export async function createRoomType(hotelId: number, input: RoomFormInput) {
  const response = await apiClient.post<ApiResponse<MerchantRoomType>>(
    '/rooms',
    {
      hotelId,
      name: input.name,
      price: input.price,
    },
  )
  return response.data.data
}

export async function updateRoomType(id: number, input: RoomFormInput) {
  const response = await apiClient.patch<ApiResponse<MerchantRoomType>>(
    `/rooms/${id}`,
    input,
  )
  return response.data.data
}

function toHotelPayload(input: HotelFormInput) {
  return {
    nameCn: input.nameCn,
    nameEn: input.nameEn,
    address: input.address,
    starRating: Number(input.starRating),
    openedAt: input.openedAt,
    imageUrl: input.imageUrl,
    facilities: input.facilities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  }
}
```

- [ ] **Step 3: Run web typecheck and confirm the new imports compile**

Run:

```bash
pnpm --filter @hotel/web typecheck
```

Expected: FAIL only if later UI imports are not present yet; after this task alone, `api.ts` and `merchant.ts` should compile.

---

### Task 5: Frontend Merchant Management UI

**Files:**
- Create: `apps/web/src/components/MerchantHotelManager.tsx`

- [ ] **Step 1: Build the merchant manager component**

Create `apps/web/src/components/MerchantHotelManager.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createMerchantHotel,
  createRoomType,
  getApiErrorMessage,
  getMyHotels,
  updateMerchantHotel,
  updateRoomType,
} from '../lib/api'
import type {
  HotelFormInput,
  HotelStatus,
  MerchantHotel,
  MerchantRoomType,
  RoomFormInput,
} from '../types/merchant'

const emptyHotelForm: HotelFormInput = {
  nameCn: '',
  nameEn: '',
  address: '',
  starRating: '5',
  openedAt: '2024-01-01',
  imageUrl: '',
  facilities: '',
}

const emptyRoomForm: RoomFormInput = {
  name: '',
  price: '',
}

const statusLabel: Record<HotelStatus, string> = {
  PENDING_REVIEW: '待审核',
  REJECTED: '审核不通过',
  APPROVED: '审核通过',
  PUBLISHED: '已发布',
  OFFLINE: '已下线',
}

const statusClassName: Record<HotelStatus, string> = {
  PENDING_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  REJECTED: 'border-red-200 bg-red-50 text-red-700',
  APPROVED: 'border-sky-200 bg-sky-50 text-sky-700',
  PUBLISHED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  OFFLINE: 'border-slate-200 bg-slate-100 text-slate-600',
}

export function MerchantHotelManager() {
  const [editingHotelId, setEditingHotelId] = useState<number | null>(null)
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hotelForm, setHotelForm] = useState<HotelFormInput>(emptyHotelForm)
  const [hotels, setHotels] = useState<MerchantHotel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingHotel, setIsSavingHotel] = useState(false)
  const [isSavingRoom, setIsSavingRoom] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [roomForm, setRoomForm] = useState<RoomFormInput>(emptyRoomForm)
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)

  const selectedHotel = useMemo(
    () => hotels.find((hotel) => hotel.id === selectedHotelId) ?? null,
    [hotels, selectedHotelId],
  )

  useEffect(() => {
    void loadHotels()
  }, [])

  async function loadHotels(nextSelectedHotelId?: number) {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getMyHotels()
      setHotels(data)
      setSelectedHotelId(nextSelectedHotelId ?? data[0]?.id ?? null)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  function selectHotel(hotel: MerchantHotel) {
    setSelectedHotelId(hotel.id)
    setEditingHotelId(hotel.id)
    setEditingRoomId(null)
    setNotice(null)
    setError(null)
    setHotelForm({
      nameCn: hotel.nameCn,
      nameEn: hotel.nameEn,
      address: hotel.address,
      starRating: String(hotel.starRating),
      openedAt: hotel.openedAt.slice(0, 10),
      imageUrl: hotel.imageUrl ?? '',
      facilities: hotel.facilities.join(', '),
    })
    setRoomForm(emptyRoomForm)
  }

  function resetHotelForm() {
    setEditingHotelId(null)
    setHotelForm(emptyHotelForm)
    setNotice(null)
    setError(null)
  }

  async function handleHotelSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingHotel(true)
    setError(null)
    setNotice(null)

    try {
      const savedHotel =
        editingHotelId === null
          ? await createMerchantHotel(hotelForm)
          : await updateMerchantHotel(editingHotelId, hotelForm)

      setNotice('酒店已保存，并进入待审核状态')
      setEditingHotelId(savedHotel.id)
      await loadHotels(savedHotel.id)
    } catch (saveError) {
      setError(getApiErrorMessage(saveError))
    } finally {
      setIsSavingHotel(false)
    }
  }

  function editRoom(roomType: MerchantRoomType) {
    setEditingRoomId(roomType.id)
    setRoomForm({
      name: roomType.name,
      price: roomType.price,
    })
    setNotice(null)
    setError(null)
  }

  function resetRoomForm() {
    setEditingRoomId(null)
    setRoomForm(emptyRoomForm)
  }

  async function handleRoomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedHotel) {
      setError('请先选择一个酒店')
      return
    }

    setIsSavingRoom(true)
    setError(null)
    setNotice(null)

    try {
      if (editingRoomId === null) {
        await createRoomType(selectedHotel.id, roomForm)
      } else {
        await updateRoomType(editingRoomId, roomForm)
      }

      setNotice('房型已保存，酒店已重新进入待审核状态')
      resetRoomForm()
      await loadHotels(selectedHotel.id)
    } catch (saveError) {
      setError(getApiErrorMessage(saveError))
    } finally {
      setIsSavingRoom(false)
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">商户后台</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              酒店与房型管理
            </h2>
          </div>
          <button
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
            type="button"
            onClick={resetHotelForm}
          >
            新建酒店
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-950">
              我的酒店
            </h3>
            <span className="text-sm text-slate-500">{hotels.length} 家</span>
          </div>

          {isLoading ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              正在加载酒店
            </div>
          ) : null}

          {!isLoading && hotels.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              暂无酒店，先创建一个酒店并添加房型
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {hotels.map((hotel) => (
              <button
                className={`w-full rounded-lg border p-4 text-left transition ${
                  selectedHotelId === hotel.id
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                key={hotel.id}
                type="button"
                onClick={() => selectHotel(hotel)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {hotel.nameCn}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {hotel.nameEn}
                    </p>
                  </div>
                  <StatusBadge status={hotel.status} />
                </div>
                <p className="mt-3 text-sm text-slate-600">{hotel.address}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {hotel.roomTypes.length} 个房型
                </p>
                {hotel.rejectReason ? (
                  <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
                    驳回原因：{hotel.rejectReason}
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={handleHotelSubmit}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-950">
                {editingHotelId === null ? '创建酒店' : '编辑酒店'}
              </h3>
              {selectedHotel ? <StatusBadge status={selectedHotel.status} /> : null}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextField
                label="酒店中文名"
                required
                value={hotelForm.nameCn}
                onChange={(value) =>
                  setHotelForm((current) => ({ ...current, nameCn: value }))
                }
              />
              <TextField
                label="酒店英文名"
                required
                value={hotelForm.nameEn}
                onChange={(value) =>
                  setHotelForm((current) => ({ ...current, nameEn: value }))
                }
              />
              <TextField
                className="sm:col-span-2"
                label="酒店地址"
                required
                value={hotelForm.address}
                onChange={(value) =>
                  setHotelForm((current) => ({ ...current, address: value }))
                }
              />
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  酒店星级
                </span>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={hotelForm.starRating}
                  onChange={(event) =>
                    setHotelForm((current) => ({
                      ...current,
                      starRating: event.target.value,
                    }))
                  }
                >
                  <option value="1">1 星</option>
                  <option value="2">2 星</option>
                  <option value="3">3 星</option>
                  <option value="4">4 星</option>
                  <option value="5">5 星</option>
                </select>
              </label>
              <TextField
                label="开业时间"
                required
                type="date"
                value={hotelForm.openedAt}
                onChange={(value) =>
                  setHotelForm((current) => ({ ...current, openedAt: value }))
                }
              />
              <TextField
                className="sm:col-span-2"
                label="酒店图片 URL"
                value={hotelForm.imageUrl}
                onChange={(value) =>
                  setHotelForm((current) => ({ ...current, imageUrl: value }))
                }
              />
              <TextField
                className="sm:col-span-2"
                label="酒店设施"
                value={hotelForm.facilities}
                onChange={(value) =>
                  setHotelForm((current) => ({ ...current, facilities: value }))
                }
              />
            </div>

            <button
              className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={isSavingHotel}
              type="submit"
            >
              {isSavingHotel ? '保存中' : '保存并提交审核'}
            </button>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-950">
              房型与价格
            </h3>

            {selectedHotel ? (
              <form className="mt-4 space-y-3" onSubmit={handleRoomSubmit}>
                <TextField
                  label="房型名称"
                  required
                  value={roomForm.name}
                  onChange={(value) =>
                    setRoomForm((current) => ({ ...current, name: value }))
                  }
                />
                <TextField
                  label="房型价格"
                  required
                  type="number"
                  value={roomForm.price}
                  onChange={(value) =>
                    setRoomForm((current) => ({ ...current, price: value }))
                  }
                />
                <button
                  className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isSavingRoom}
                  type="submit"
                >
                  {isSavingRoom
                    ? '保存中'
                    : editingRoomId === null
                      ? '添加房型'
                      : '保存房型'}
                </button>
                {editingRoomId !== null ? (
                  <button
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                    type="button"
                    onClick={resetRoomForm}
                  >
                    取消编辑
                  </button>
                ) : null}
              </form>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                选择或创建酒店后维护房型
              </div>
            )}

            {selectedHotel ? (
              <div className="mt-5 space-y-3">
                {selectedHotel.roomTypes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                    当前酒店暂无房型
                  </div>
                ) : null}

                {selectedHotel.roomTypes.map((roomType) => (
                  <button
                    className="w-full rounded-lg border border-slate-200 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                    key={roomType.id}
                    type="button"
                    onClick={() => editRoom(roomType)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-900">
                        {roomType.name}
                      </span>
                      <span className="text-sm font-semibold text-emerald-700">
                        ¥{roomType.price}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

function StatusBadge({ status }: { status: HotelStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassName[status]}`}
    >
      {statusLabel[status]}
    </span>
  )
}

function TextField({
  className = '',
  label,
  onChange,
  required = false,
  type = 'text',
  value,
}: {
  className?: string
  label: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
  value: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
```

- [ ] **Step 2: Run web typecheck**

Run:

```bash
pnpm --filter @hotel/web typecheck
```

Expected: FAIL because `MerchantHotelManager` is not imported into `App.tsx` yet only if unused-file rules are active; if it passes, continue.

---

### Task 6: Frontend App Integration

**Files:**
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Render merchant manager for MERCHANT users**

Replace `apps/web/src/App.tsx` with:

```tsx
import { useEffect, useState } from 'react'
import { AuthForm } from './components/AuthForm'
import { MerchantHotelManager } from './components/MerchantHotelManager'
import { useAuthStore } from './store/auth-store'
import type { Role } from './types/auth'

const roleLabel: Record<Role, string> = {
  USER: '普通用户',
  MERCHANT: '商户',
  ADMIN: '管理员',
}

const roleDestinations: Record<Role, string[]> = {
  USER: ['查询酒店', '查看酒店详情', '创建基础预订'],
  MERCHANT: ['查看我的酒店', '维护酒店与房型', '查看审核状态'],
  ADMIN: ['查看待审核酒店', '审核与驳回', '发布与下线'],
}

function App() {
  const { currentUser, logout, restore, status, token } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const isRestoring = status === 'loading' && Boolean(token) && !currentUser

  useEffect(() => {
    void restore()
  }, [restore])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                易宿酒店预订平台
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                账号与权限
              </h1>
            </div>
            {currentUser ? (
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                type="button"
                onClick={logout}
              >
                退出
              </button>
            ) : null}
          </div>

          {isRestoring ? (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              正在恢复登录状态
            </div>
          ) : null}

          {currentUser ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <span className="text-sm text-emerald-700">当前身份</span>
              <span className="font-semibold text-emerald-950">
                {currentUser.username}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {roleLabel[currentUser.role]}
              </span>
            </div>
          ) : null}
        </section>

        {!currentUser ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-3">
                <RoleCard title="普通用户" description="酒店查询与预订" />
                <RoleCard title="商户" description="酒店与房型管理" />
                <RoleCard title="管理员" description="审核与发布管理" />
              </div>
            </section>
            <AuthForm mode={mode} onModeChange={setMode} />
          </div>
        ) : currentUser.role === 'MERCHANT' ? (
          <MerchantHotelManager />
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              功能入口
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {roleDestinations[currentUser.role].map((item) => (
                <div
                  className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function RoleCard({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  )
}

export default App
```

- [ ] **Step 2: Run web checks**

Run:

```bash
pnpm --filter @hotel/web typecheck
```

Expected: PASS.

Run:

```bash
pnpm --filter @hotel/web build
```

Expected: PASS.

- [ ] **Step 3: Commit frontend implementation**

Run:

```bash
git add apps/web/src/App.tsx apps/web/src/components/MerchantHotelManager.tsx apps/web/src/lib/api.ts apps/web/src/types/merchant.ts
git commit -m "feat: add merchant hotel management ui"
```

Expected: Commit succeeds with only frontend Milestone 4 files staged.

---

### Task 7: Manual Browser Verification

**Files:**
- No source files changed in this task

- [ ] **Step 1: Start API and web dev servers**

Run:

```bash
pnpm dev
```

Expected: API listens on `http://localhost:3000`; web listens on the Vite URL printed by the terminal, usually `http://localhost:5173`.

- [ ] **Step 2: Verify merchant workflow in browser**

Use the Codex Browser plugin against the Vite URL.

Expected manual checks:
- Register or log in as a `MERCHANT`.
- 商户后台显示酒店列表、酒店表单和房型表单。
- Create a hotel with required fields.
- Created hotel appears in “我的酒店” with status `待审核`.
- Add a room type with name and price.
- Room type appears under the selected hotel.
- Edit the hotel name.
- Edited hotel still shows status `待审核`.
- Edit the room price.
- Updated room price is visible.

- [ ] **Step 3: Verify restricted roles**

Expected manual checks:
- Register or log in as a `USER`; merchant manager is not rendered.
- Existing destination cards for `USER` still render.
- If an `ADMIN` seed account is available locally, admin sees the role entry cards and not the merchant manager.

---

### Task 8: Final Verification

**Files:**
- All changed files

- [ ] **Step 1: Run backend focused checks**

Run:

```bash
pnpm --filter @hotel/api test:e2e -- merchant-management.e2e-spec.ts
```

Expected: PASS.

Run:

```bash
pnpm --filter @hotel/api test
```

Expected: PASS.

Run:

```bash
pnpm --filter @hotel/api typecheck
```

Expected: PASS.

Run:

```bash
pnpm --filter @hotel/api build
```

Expected: PASS.

- [ ] **Step 2: Run frontend checks**

Run:

```bash
pnpm --filter @hotel/web typecheck
```

Expected: PASS.

Run:

```bash
pnpm --filter @hotel/web build
```

Expected: PASS.

- [ ] **Step 3: Run root checks**

Run:

```bash
pnpm lint
```

Expected: PASS.

Run:

```bash
pnpm typecheck
```

Expected: PASS.

Run:

```bash
pnpm test
```

Expected: PASS. The web package prints its configured “No tests configured for web” message and exits successfully.

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 4: Review changed files**

Run:

```bash
git status --short
```

Expected: Only Milestone 4 files are changed after commits if no final formatting changed files.

Run:

```bash
git diff --stat
```

Expected: Diff is scoped to backend merchant APIs, frontend merchant UI, and tests.

---

## Self-Review

- Spec coverage: Milestone 4 hotel creation, hotel edit, room creation, room edit, pending-review status, merchant ownership, audit status display, and reject reason display are each covered by a task.
- Scope control: Admin audit routes, public hotel search/detail, bookings, payments, room deletion, image upload, map/location, and inventory remain outside this milestone.
- Type consistency: Backend uses Prisma enum values `PENDING_REVIEW`, `REJECTED`, `APPROVED`, `PUBLISHED`, `OFFLINE`; frontend `HotelStatus` matches these values exactly.
- API consistency: Responses continue using `{ code, message, data }`; auth token transport remains the existing `Authorization: Bearer <token>` interceptor.
- Placeholder scan: The plan contains concrete file paths, code blocks, commands, and expected outcomes for every implementation task.
