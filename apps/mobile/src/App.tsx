import { useEffect, useState } from "react";
import { MobileHotelDetail } from "./components/MobileHotelDetail";
import { MobileHotelList } from "./components/MobileHotelList";
import { MobileHotelSearch } from "./components/MobileHotelSearch";
import { MobileUserAuth } from "./components/MobileUserAuth";
import {
  clearStoredToken,
  getApiErrorMessage,
  getCurrentUser,
  loginAccount,
  registerUserAccount,
} from "./lib/api";
import type { CurrentUser } from "./types/auth";
import type { HotelSearchParams } from "./types/hotel";

type MobileView = "search" | "list" | "detail";
type AuthMode = "login" | "register";

const emptySearchParams: HotelSearchParams = {
  city: "",
  keyword: "",
  checkInDate: "",
  checkOutDate: "",
};

export default function App() {
  const [searchParams, setSearchParams] =
    useState<HotelSearchParams>(emptySearchParams);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [view, setView] = useState<MobileView>("search");
  const listKey = JSON.stringify(searchParams);

  useEffect(() => {
    let isActive = true;

    getCurrentUser()
      .then((user) => {
        if (isActive) {
          setCurrentUser(user);
          setAuthError(null);
        }
      })
      .catch(() => {
        if (isActive) {
          clearStoredToken();
          setCurrentUser(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsRestoring(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

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

  async function handleLogin(username: string, password: string) {
    setIsAuthSubmitting(true);
    setAuthError(null);

    try {
      const data = await loginAccount({ username, password });
      window.localStorage.setItem("hotel_auth_token", data.token);
      setCurrentUser(data.user);
      setIsAuthOpen(false);
    } catch (error: unknown) {
      clearStoredToken();
      setCurrentUser(null);
      setAuthError(getApiErrorMessage(error));
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  async function handleRegister(username: string, password: string) {
    setIsAuthSubmitting(true);
    setAuthError(null);

    try {
      await registerUserAccount({ username, password });
      await handleLogin(username, password);
    } catch (error: unknown) {
      clearStoredToken();
      setCurrentUser(null);
      setAuthError(getApiErrorMessage(error));
      setIsAuthSubmitting(false);
    }
  }

  function handleLogout() {
    clearStoredToken();
    setCurrentUser(null);
    setAuthError(null);
    setAuthMode("login");
  }

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
                酒店查询与预订
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                这是面向用户的移动端入口，仅展示已发布酒店。游客可以浏览，普通用户登录后可创建基础预订记录。
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                M7
              </span>
              <button
                className="rounded-2xl border border-[#d9ccb7] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#fff8ee]"
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
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill
              label={
                currentUser
                  ? `当前用户：${currentUser.username} / ${currentUser.role}`
                  : "当前身份：游客"
              }
            />
            <StatusPill label="仅普通用户可预订" />
          </div>

          {isRestoring ? (
            <div className="mt-4 rounded-2xl border border-[#e6dccb] bg-[#faf5ec] px-4 py-3 text-sm text-slate-600">
              正在恢复登录状态...
            </div>
          ) : null}
        </section>

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

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#ddd1bd] bg-[#fffdf8] px-3 py-1 text-xs font-semibold text-slate-700">
      {label}
    </span>
  );
}
