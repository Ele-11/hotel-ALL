import { useState } from "react";
import { MobileUserAuth } from "../components/auth/MobileUserAuth";
import { useMobileAuthStore } from "../stores/auth-store";
import type { HotelSearchParams } from "../types/hotel";
import { MobileHotelDetail } from "./hotels/MobileHotelDetail";
import { MobileHotelList } from "./hotels/MobileHotelList";
import { MobileHotelSearch } from "./hotels/MobileHotelSearch";

type MobileView = "search" | "list" | "detail";

const emptySearchParams: HotelSearchParams = {
  city: "",
  keyword: "",
  checkInDate: "",
  checkOutDate: "",
};

export function MobileAppView() {
  const [searchParams, setSearchParams] =
    useState<HotelSearchParams>(emptySearchParams);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [view, setView] = useState<MobileView>("search");
  const {
    authError,
    authMode,
    currentUser,
    isAuthOpen,
    isAuthSubmitting,
    isRestoring,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    setAuthMode,
    setIsAuthOpen,
  } = useMobileAuthStore();
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
        <div className="flex justify-end">
          <button
            className="rounded-2xl border border-[#d9ccb7] bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-[#d8ccb7]/25 transition hover:bg-[#fff8ee]"
            type="button"
            onClick={() => {
              if (currentUser) {
                handleLogout();
                return;
              }

              setIsAuthOpen(true);
            }}
          >
            {currentUser ? `退出 ${currentUser.username}` : "登录 / 注册"}
          </button>
        </div>

        {isRestoring ? (
          <div className="rounded-2xl border border-[#e6dccb] bg-[#faf5ec] px-4 py-3 text-sm text-slate-600">
            正在恢复登录状态...
          </div>
        ) : null}

        {isAuthOpen ? (
          <MobileUserAuth
            error={authError}
            isSubmitting={isAuthSubmitting}
            mode={authMode}
            onClose={() => setIsAuthOpen(false)}
            onLogin={handleLogin}
            onModeChange={setAuthMode}
            onRegister={handleRegister}
          />
        ) : null}

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
            currentUser={currentUser}
            hotelId={selectedHotelId}
            searchParams={searchParams}
            onBack={() => setView("list")}
            onRequireAuth={() => {
              setAuthMode("login");
              setIsAuthOpen(true);
            }}
          />
        ) : null}
      </div>
    </main>
  );
}
