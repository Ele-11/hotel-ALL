import { useState } from "react";
import { MobileHotelDetail } from "./components/MobileHotelDetail";
import { MobileHotelList } from "./components/MobileHotelList";
import { MobileHotelSearch } from "./components/MobileHotelSearch";
import type { HotelSearchParams } from "./types/hotel";

type MobileView = "search" | "list" | "detail";

const emptySearchParams: HotelSearchParams = {
  city: "",
  keyword: "",
  checkInDate: "",
  checkOutDate: "",
};

export default function App() {
  const [searchParams, setSearchParams] =
    useState<HotelSearchParams>(emptySearchParams);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [view, setView] = useState<MobileView>("search");
  const listKey = JSON.stringify(searchParams);

  function handleSearch(nextSearchParams: HotelSearchParams) {
    setSearchParams(nextSearchParams);
    setSelectedHotelId(null);
    setView("list");
  }

  function handleSelectHotel(hotelId: number) {
    setSelectedHotelId(hotelId);
    setView("detail");
  }

  const detailKey =
    selectedHotelId === null
      ? "detail-empty"
      : `${selectedHotelId}:${searchParams.checkInDate}:${searchParams.checkOutDate}`;

  return (
    <main className="min-h-screen px-4 py-5 text-slate-900">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4">
        <section className="rounded-[30px] border border-[#e4d9c5] bg-white/90 p-5 shadow-sm shadow-[#d8ccb7]/35 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-emerald-700">
                EASYSTAY MOBILE
              </p>
              <h1 className="mt-2 text-[1.9rem] font-semibold tracking-tight text-slate-950">
                酒店查询与详情
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                这是面向用户的移动端入口，仅展示已发布酒店，不混入商户或管理员后台内容。
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              M6
            </span>
          </div>
        </section>

        {view === "search" ? (
          <MobileHotelSearch
            initialValue={searchParams}
            onSearch={handleSearch}
          />
        ) : null}

        {view === "list" ? (
          <MobileHotelList
            key={listKey}
            searchParams={searchParams}
            onBack={() => setView("search")}
            onSelectHotel={handleSelectHotel}
          />
        ) : null}

        {view === "detail" && selectedHotelId !== null ? (
          <MobileHotelDetail
            key={detailKey}
            hotelId={selectedHotelId}
            searchParams={searchParams}
            onBack={() => setView("list")}
          />
        ) : null}
      </div>
    </main>
  );
}
