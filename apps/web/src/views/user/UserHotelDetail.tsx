import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getApiErrorMessage, getPublicHotelDetail } from "../../apis";
import type { HotelSearchParams, PublicHotelDetail } from "../../types/hotel";

type UserHotelDetailProps = {
  currentUserRole: "guest" | "USER";
  hotelId: number;
  onBack: () => void;
  searchParams: HotelSearchParams;
};

export function UserHotelDetail({
  currentUserRole,
  hotelId,
  onBack,
  searchParams,
}: UserHotelDetailProps) {
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
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">酒店详情</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            酒店信息与房型
          </h2>
        </div>
        <button
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          type="button"
          onClick={onBack}
        >
          返回列表
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          正在加载酒店详情...
        </div>
      ) : !hotel ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          当前酒店不可见，可能尚未发布或已下线。
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <div className="space-y-5">
            <HotelHero hotel={hotel} />

            <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    房型与价格
                  </h3>
                </div>
              </div>

              {hotel.roomTypes.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                  当前酒店暂未配置可展示房型。
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {hotel.roomTypes.map((roomType) => (
                    <article
                      className="rounded-[22px] border border-slate-200 bg-white p-4"
                      key={roomType.id}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-slate-950">
                            {roomType.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              每晚价格
                            </p>
                            <p className="mt-1 text-xl font-semibold text-emerald-700">
                              ¥{roomType.price}
                            </p>
                          </div>
                          <button
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
                            disabled
                            type="button"
                          >
                            {currentUserRole === "USER"
                              ? "预订"
                              : "登录"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4">
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

            <InfoCard title="基础信息">
              <SummaryRow label="酒店英文名" value={hotel.nameEn} />
              <SummaryRow
                label="开业时间"
                value={hotel.openedAt.slice(0, 10)}
              />
              <SummaryRow label="星级" value={`${hotel.starRating} 星`} />
            </InfoCard>

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
          </aside>
        </div>
      )}
    </section>
  );
}

function HotelHero({ hotel }: { hotel: PublicHotelDetail }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 text-white">
      {hotel.imageUrl ? (
        <img
          alt={hotel.nameCn}
          className="h-64 w-full object-cover"
          src={hotel.imageUrl}
        />
      ) : (
        <div className="flex h-64 items-end bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.3),_transparent_45%),linear-gradient(135deg,_#0f172a,_#134e4a)] p-5">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
            酒店图片暂未提供
          </span>
        </div>
      )}

      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">
              {hotel.nameCn}
            </h3>
            <p className="mt-2 text-sm text-slate-300">{hotel.address}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            {hotel.starRating} 星酒店
          </span>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
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
