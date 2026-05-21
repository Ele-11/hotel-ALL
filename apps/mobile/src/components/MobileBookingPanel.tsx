import { useMemo, useState } from "react";
import { createBooking, getApiErrorMessage } from "../lib/api";
import type { BookingRecord } from "../types/booking";
import type { CurrentUser } from "../types/auth";
import type { PublicHotelDetail } from "../types/hotel";

type MobileBookingPanelProps = {
  currentUser: CurrentUser | null;
  hotel: PublicHotelDetail;
  onRequireAuth: () => void;
};

export function MobileBookingPanel({
  currentUser,
  hotel,
  onRequireAuth,
}: MobileBookingPanelProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    hotel.roomTypes[0]?.id ?? null,
  );
  const [guestCount, setGuestCount] = useState("2");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<BookingRecord | null>(
    null,
  );

  const selectedRoom =
    hotel.roomTypes.find((roomType) => roomType.id === selectedRoomId) ?? null;
  const estimatedTotal = useMemo(() => {
    if (!selectedRoom || hotel.nights <= 0) {
      return null;
    }

    return (Number(selectedRoom.price) * hotel.nights).toFixed(2);
  }, [hotel.nights, selectedRoom]);

  const canSubmit =
    Boolean(selectedRoom) &&
    Boolean(hotel.checkInDate) &&
    Boolean(hotel.checkOutDate) &&
    hotel.nights > 0 &&
    currentUser?.role === "USER";

  async function handleSubmit() {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (currentUser.role !== "USER") {
      setError("只有普通用户可以创建预订记录");
      return;
    }

    if (!selectedRoom || !hotel.checkInDate || !hotel.checkOutDate) {
      setError("请选择有效的入住与离店日期后再提交");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const booking = await createBooking({
        hotelId: hotel.id,
        roomId: selectedRoom.id,
        checkInDate: hotel.checkInDate,
        checkOutDate: hotel.checkOutDate,
        guestCount: Number(guestCount),
      });
      setSuccessBooking(booking);
    } catch (submitError: unknown) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[24px] border border-[#d8ccb7] bg-[linear-gradient(180deg,#fffdfa_0%,#f6efe2_100%)] p-4 shadow-sm shadow-[#d8ccb7]/25">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-emerald-700">基础预订</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
            选择房型并创建记录
          </h3>
        </div>
        <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
          M7
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {hotel.roomTypes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d9ccb7] bg-white/80 px-4 py-4 text-sm text-slate-600">
            当前酒店没有可预订房型。
          </div>
        ) : (
          hotel.roomTypes.map((roomType) => {
            const isSelected = roomType.id === selectedRoomId;

            return (
              <label
                className={`block cursor-pointer rounded-[22px] border px-4 py-4 transition ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-[#e6dccb] bg-white hover:border-[#d9ccb7]"
                }`}
                key={roomType.id}
              >
                <input
                  checked={isSelected}
                  className="sr-only"
                  name="roomType"
                  type="radio"
                  value={roomType.id}
                  onChange={() => setSelectedRoomId(roomType.id)}
                />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-950">
                      {roomType.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      每晚价格按后端口径结算。
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      每晚
                    </p>
                    <p className="mt-1 text-xl font-semibold text-emerald-700">
                      ￥{roomType.price}
                    </p>
                  </div>
                </div>
              </label>
            );
          })
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SummaryCard label="入住日期" value={hotel.checkInDate ?? "未选择"} />
        <SummaryCard label="离店日期" value={hotel.checkOutDate ?? "未选择"} />
        <SummaryCard
          label="间夜数"
          value={hotel.nights > 0 ? `${hotel.nights} 晚` : "未计算"}
        />
        <label className="block rounded-[22px] border border-[#e6dccb] bg-white px-4 py-3">
          <span className="text-sm font-medium text-slate-700">入住人数</span>
          <input
            className="mt-2 w-full rounded-2xl border border-[#e4d9c5] bg-[#fffdfa] px-3 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            min="1"
            step="1"
            type="number"
            value={guestCount}
            onChange={(event) => setGuestCount(event.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 rounded-[22px] border border-[#e6dccb] bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-500">预估总价</span>
          <span className="text-xl font-semibold text-slate-950">
            {estimatedTotal ? `￥${estimatedTotal}` : "等待日期与房型"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          实际写入的总价由后端根据房型价格与间夜数计算，不使用前端硬编码值。
        </p>
      </div>

      {!hotel.checkInDate || !hotel.checkOutDate || hotel.nights <= 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          请先返回搜索页选择有效的入住和离店日期，再创建预订。
        </div>
      ) : null}

      {!currentUser ? (
        <div className="mt-4 rounded-2xl border border-[#ddd1bd] bg-white px-4 py-4">
          <p className="text-sm leading-6 text-slate-600">
            当前以游客身份浏览。登录普通用户账号后才能提交预订记录。
          </p>
          <button
            className="mt-3 w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            type="button"
            onClick={onRequireAuth}
          >
            登录后创建预订
          </button>
        </div>
      ) : currentUser.role !== "USER" ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          当前账号角色为 {currentUser.role}。只有普通用户可以创建预订记录。
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successBooking ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          预订创建成功：#{successBooking.id}，共 {successBooking.guestCount} 人，
          总价 ￥{successBooking.totalPrice}。
        </div>
      ) : null}

      <button
        className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={!canSubmit || isSubmitting}
        type="button"
        onClick={() => void handleSubmit()}
      >
        {isSubmitting ? "正在创建预订..." : "创建基础预订记录"}
      </button>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#e6dccb] bg-white px-4 py-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}
