import { HotelStatus, PrismaClient, Role } from '@prisma/client';
import { PasswordService } from '../src/auth/password.service';

const prisma = new PrismaClient();
const passwordService = new PasswordService();

async function main() {
  const adminPassword = await passwordService.hashPassword(
    process.env.SEED_ADMIN_PASSWORD ?? 'admin123456',
  );
  const merchantPassword = await passwordService.hashPassword(
    process.env.SEED_MERCHANT_PASSWORD ?? 'merchant123456',
  );
  const userPassword = await passwordService.hashPassword(
    process.env.SEED_USER_PASSWORD ?? 'user123456',
  );

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: adminPassword,
      role: Role.ADMIN,
    },
    create: {
      username: 'admin',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const merchant = await prisma.user.upsert({
    where: { username: 'merchant01' },
    update: {
      password: merchantPassword,
      role: Role.MERCHANT,
    },
    create: {
      username: 'merchant01',
      password: merchantPassword,
      role: Role.MERCHANT,
    },
  });

  const user = await prisma.user.upsert({
    where: { username: 'user01' },
    update: {
      password: userPassword,
      role: Role.USER,
    },
    create: {
      username: 'user01',
      password: userPassword,
      role: Role.USER,
    },
  });

  const hotels = await Promise.all([
    upsertHotel({
      nameEn: 'Pending Review Hotel',
      nameCn: '待审核酒店',
      status: HotelStatus.PENDING_REVIEW,
      merchantId: merchant.id,
    }),
    upsertHotel({
      nameEn: 'Rejected Hotel',
      nameCn: '审核不通过酒店',
      status: HotelStatus.REJECTED,
      merchantId: merchant.id,
      rejectReason: '酒店地址信息不完整',
    }),
    upsertHotel({
      nameEn: 'Approved Hotel',
      nameCn: '审核通过酒店',
      status: HotelStatus.APPROVED,
      merchantId: merchant.id,
    }),
    upsertHotel({
      nameEn: 'Published Hotel',
      nameCn: '已发布酒店',
      status: HotelStatus.PUBLISHED,
      merchantId: merchant.id,
    }),
    upsertHotel({
      nameEn: 'Offline Hotel',
      nameCn: '已下线酒店',
      status: HotelStatus.OFFLINE,
      merchantId: merchant.id,
    }),
  ]);

  const publishedHotel = hotels.find(
    (hotel) => hotel.status === HotelStatus.PUBLISHED,
  );

  if (!publishedHotel) {
    throw new Error('Published hotel seed was not created.');
  }

  const superiorRoom = await upsertRoomType({
    hotelId: publishedHotel.id,
    name: '高级大床房',
    price: '399.00',
  });

  await upsertRoomType({
    hotelId: publishedHotel.id,
    name: '豪华双床房',
    price: '599.00',
  });

  await prisma.booking.upsert({
    where: { id: 1 },
    update: {
      userId: user.id,
      hotelId: publishedHotel.id,
      roomTypeId: superiorRoom.id,
      checkInDate: new Date('2026-06-01T00:00:00.000Z'),
      checkOutDate: new Date('2026-06-03T00:00:00.000Z'),
      guestCount: 2,
      totalPrice: '798.00',
    },
    create: {
      id: 1,
      userId: user.id,
      hotelId: publishedHotel.id,
      roomTypeId: superiorRoom.id,
      checkInDate: new Date('2026-06-01T00:00:00.000Z'),
      checkOutDate: new Date('2026-06-03T00:00:00.000Z'),
      guestCount: 2,
      totalPrice: '798.00',
    },
  });

  console.log(`Seeded admin user: ${admin.username}`);
}

async function upsertHotel(input: {
  nameCn: string;
  nameEn: string;
  status: HotelStatus;
  merchantId: number;
  rejectReason?: string;
}) {
  return prisma.hotel.upsert({
    where: { nameEn: input.nameEn },
    update: {
      nameCn: input.nameCn,
      address: '上海市黄浦区中山东一路 1 号',
      starRating: 5,
      openedAt: new Date('2020-01-01T00:00:00.000Z'),
      imageUrl: null,
      facilities: ['WiFi', '停车场'],
      status: input.status,
      rejectReason: input.rejectReason ?? null,
      merchantId: input.merchantId,
    },
    create: {
      nameCn: input.nameCn,
      nameEn: input.nameEn,
      address: '上海市黄浦区中山东一路 1 号',
      starRating: 5,
      openedAt: new Date('2020-01-01T00:00:00.000Z'),
      imageUrl: null,
      facilities: ['WiFi', '停车场'],
      status: input.status,
      rejectReason: input.rejectReason ?? null,
      merchantId: input.merchantId,
    },
  });
}

async function upsertRoomType(input: {
  hotelId: number;
  name: string;
  price: string;
}) {
  return prisma.roomType.upsert({
    where: {
      hotelId_name: {
        hotelId: input.hotelId,
        name: input.name,
      },
    },
    update: {
      price: input.price,
    },
    create: {
      hotelId: input.hotelId,
      name: input.name,
      price: input.price,
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
