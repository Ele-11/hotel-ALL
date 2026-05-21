import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage, getPublicHotels } from "../lib/api";
import type { HotelSearchParams, PublicHotelListItem } from "../types/hotel";

type UserHotelListProps = {
  onBack: () => void;
  onSelectHotel: (hotelId: number) => void;
  searchParams: HotelSearchParams;
};

const PAGE_SIZE = 6;

export function UserHotelList({
  onBack,
  onSelectHotel,
  searchParams,
}: UserHotelListProps) {
  const [items, setItems] = useState<PublicHotelListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryKey = JSON.stringify(searchParams);
  const hasMore = items.length < total;
  const summaryItems = useMemo(
    () =>
      [
        searchParams.city ? `地点：${searchParams.city}` : null,
        searchParams.keyword ? `关键字：${searchParams.keyword}` : null,
        searchParams.checkInDate ? `入住：${searchParams.checkInDate}` : null,
        searchParams.checkOutDate ? `离店：${searchParams.checkOutDate}` : null,
      ].filter(Boolean) as string[],
    [searchParams],
  );

  useEffect(() => {
    let isActive = true;

    getPublicHotels({
      ...searchParams,
      page: 1,
      pageSize: PAGE_SIZE,
    })
      .then((data) => {
        if (!isActive) {
          return;
        }

        setError(null);
        setItems(data.items);
        setTotal(data.total);
        setPage(1);
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
  }, [queryKey, searchParams]);

  async function handleLoadMore() {
    const nextPage = page + 1;

    setIsLoadingMore(true);
    setError(null);

    try {
      const data = await getPublicHotels({
        ...searchParams,
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      setItems((current) => [...current, ...data.items]);
      setPage(nextPage);
      setTotal(data.total);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">用户端酒店列表</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            已发布酒店
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {summaryItems.length === 0 ? (
              <FilterChip label="未设置筛选条件" />
            ) : (
              summaryItems.map((item) => <FilterChip key={item} label={item} />)
            )}
          </div>
        </div>
        <button
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          type="button"
          onClick={onBack}
        >
          返回查询
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          正在加载酒店列表...
        </div>
      ) : items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          当前条件下没有可展示的已发布酒店。
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((hotel) => (
              <article
                className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                key={hotel.id}
              >
                <HotelCover imageUrl={hotel.imageUrl} name={hotel.nameCn} />
                <div className="space-y-4 p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {hotel.nameCn}
                      </h3>
                      <StarTag value={hotel.starRating} />
                    </div>
                    <p className="min-h-10 text-sm leading-6 text-slate-600">
                      {hotel.address}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        最低价
                      </p>
                      <p className="mt-1 text-lg font-semibold text-emerald-700">
                        {hotel.minPrice ? `¥${hotel.minPrice}` : "待补充"}
                      </p>
                    </div>
                    <button
                      className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      type="button"
                      onClick={() => onSelectHotel(hotel.id)}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              已展示 {items.length} / {total} 家酒店
            </p>
            {hasMore ? (
              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={isLoadingMore}
                type="button"
                onClick={() => void handleLoadMore()}
              >
                {isLoadingMore ? "加载中..." : "加载更多"}
              </button>
            ) : (
              <span className="text-sm text-slate-500">已经到底了</span>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      {label}
    </span>
  );
}

function StarTag({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
      {value} 星
    </span>
  );
}

function HotelCover({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  if (imageUrl) {
    return (
      <img alt={name} className="h-44 w-full object-cover" src={imageUrl} />
    );
  }

  return (
    <div className="flex h-44 w-full items-end bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.35),_transparent_48%),linear-gradient(135deg,_#0f172a,_#14532d)] p-4">
      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
        图片待补充
      </span>
    </div>
  );
}
