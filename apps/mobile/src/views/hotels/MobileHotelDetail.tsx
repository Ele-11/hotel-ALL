import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getApiErrorMessage, getPublicHotelDetail } from "../../apis";
import type { CurrentUser } from "../../types/auth";
import type { HotelSearchParams, PublicHotelDetail } from "../../types/hotel";
import { MobileBookingPanel } from "../bookings/MobileBookingPanel";

type MobileHotelDetailProps = {
  currentUser: CurrentUser | null;
  hotelId: number;
  onBack: () => void;
  onRequireAuth: () => void;
  searchParams: HotelSearchParams;
};

export function MobileHotelDetail({
  currentUser,
  hotelId,
  onBack,
  onRequireAuth,
  searchParams,
}: MobileHotelDetailProps) {
  const [hotel, setHotel] = useState<PublicHotelDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    getPublicHotelDetail(hotelId, {
      checkInDate: searchParams.checkInDate,
      checkOutDate: searchParams.checkOutDate,
    })
      .then((data) => {
        if (isActive) {
          setError(null);
          setHotel(data);
        }
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(getApiErrorMessage(loadError));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [hotelId, searchParams.checkInDate, searchParams.checkOutDate]);

  return (
    <section className="rounded-[30px] border border-[#e4d9c5] bg-white p-4 shadow-sm shadow-[#d8ccb7]/35">
      <div className="flex items-start justify-between gap-3 border-b border-[#efe5d6] pb-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">酒店详情</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            酒店信息与房型
          </h2>
        </div>
        <button
          className="rounded-2xl border border-[#d9ccb7] bg-[#faf5ec] px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#f3eadb]"
          type="button"
          onClick={onBack}
        >
          返回列表
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-4 rounded-2xl border border-[#e6dccb] bg-[#faf5ec] p-5 text-sm text-slate-600">
          正在加载酒店详情...
        </div>
      ) : !hotel ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#d9ccb7] bg-[#faf5ec] p-5 text-sm text-slate-600">
          当前酒店不可见，可能尚未发布或已下线。
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <HotelHero hotel={hotel} />

          <InfoCard title="入住信息">
            <SummaryRow
              label="入住日期"
              value={hotel.checkInDate ?? "未选择"}
            />
            <SummaryRow
              label="离店日期"
              value={hotel.checkOutDate ?? "未选择"}
            />
            <SummaryRow
              label="间夜数"
              value={hotel.nights > 0 ? `${hotel.nights} 晚` : "未计算"}
            />
          </InfoCard>

          <InfoCard title="房型与价格">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">房型已按价格从低到高排列。</p>
              <span className="rounded-full border border-[#ddd1bd] bg-[#faf5ec] px-3 py-1 text-xs font-semibold text-slate-700">
                共 {hotel.roomTypes.length} 个房型
              </span>
            </div>

            {hotel.roomTypes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#d9ccb7] bg-[#faf5ec] px-4 py-4 text-sm text-slate-600">
                当前酒店暂未配置可展示房型。
              </p>
            ) : (
              <div className="space-y-3">
                {hotel.roomTypes.map((roomType) => (
                  <article
                    className="rounded-[22px] border border-[#e6dccb] bg-[#fffdfa] p-4"
                    key={roomType.id}
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-950">
                          {roomType.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          公开价格与预订入口已开放，可在下方创建基础预订记录。
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            每晚价格
                          </p>
                          <p className="mt-1 text-xl font-semibold text-emerald-700">
                            ￥{roomType.price}
                          </p>
                        </div>
                        <button
                          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
                          type="button"
                          onClick={() => {
                            document
                              .getElementById("mobile-booking-panel")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }}
                        >
                          去创建预订
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </InfoCard>

            <InfoCard title="基础信息">
              <SummaryRow label="酒店英文名" value={hotel.nameEn} />
              <SummaryRow label="开业时间" value={hotel.openedAt.slice(0, 10)} />
              <SummaryRow label="星级" value={`${hotel.starRating} 星`} />
            </InfoCard>

            <div id="mobile-booking-panel">
              <MobileBookingPanel
                key={`${hotel.id}:${hotel.checkInDate ?? "na"}:${hotel.checkOutDate ?? "na"}`}
                currentUser={currentUser}
                hotel={hotel}
                onRequireAuth={onRequireAuth}
              />
            </div>

            <InfoCard title="设施">
              {hotel.facilities.length === 0 ? (
              <p className="text-sm text-slate-500">暂无设施信息</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hotel.facilities.map((item) => (
                  <span
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </InfoCard>
        </div>
      )}
    </section>
  );
}

function HotelHero({ hotel }: { hotel: PublicHotelDetail }) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-[#e6dccb] bg-[#fffdfa]">
      {hotel.imageUrl ? (
        <img
          alt={hotel.nameCn}
          className="h-56 w-full object-cover"
          src={hotel.imageUrl}
        />
      ) : (
        <div className="flex h-56 items-end bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_45%),linear-gradient(135deg,_#f6efe2,_#e9dcc2)] p-5">
          <span className="rounded-full border border-[#ddd1bd] bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
            默认占位图
          </span>
        </div>
      )}

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              {hotel.nameCn}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hotel.address}
            </p>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {hotel.starRating} 星酒店
          </span>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-[24px] border border-[#e6dccb] bg-[#fffdfa] p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
