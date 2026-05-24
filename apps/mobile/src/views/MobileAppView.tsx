import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { MobileUserAuth } from "../components/auth/MobileUserAuth";
import { useMobileAuthStore } from "../stores/auth-store";
import type { CurrentUser } from "../types/auth";
import type { HotelSearchParams } from "../types/hotel";
import { MobileHotelDetail } from "./hotels/MobileHotelDetail";
import { MobileHotelList } from "./hotels/MobileHotelList";
import { MobileHotelSearch } from "./hotels/MobileHotelSearch";

const EMPTY_SEARCH_PARAMS: HotelSearchParams = {
  city: "",
  keyword: "",
  checkInDate: "",
  checkOutDate: "",
};

export function MobileAppView() {
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

        <Routes>
          <Route index element={<SearchRoute />} />
          <Route path="hotels" element={<ListRoute />} />
          <Route
            path="hotels/:hotelId"
            element={
              <DetailRoute
                currentUser={currentUser}
                onRequireAuth={() => {
                  setAuthMode("login");
                  setIsAuthOpen(true);
                }}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </main>
  );
}

function SearchRoute() {
  const navigate = useNavigate();
  const [urlSearchParams] = useSearchParams();
  const searchParams = parseHotelSearchParams(urlSearchParams);
  const searchKey = urlSearchParams.toString();

  return (
    <MobileHotelSearch
      key={searchKey}
      initialValue={searchParams}
      onSearch={(nextSearchParams) => {
        navigate(`/hotels${buildHotelSearchQuery(nextSearchParams)}`);
      }}
    />
  );
}

function ListRoute() {
  const navigate = useNavigate();
  const [urlSearchParams] = useSearchParams();
  const searchParams = parseHotelSearchParams(urlSearchParams);
  const listKey = urlSearchParams.toString();

  return (
    <MobileHotelList
      key={listKey}
      searchParams={searchParams}
      onBack={() => {
        navigate(`/${buildHotelSearchQuery(searchParams)}`);
      }}
      onSelectHotel={(hotelId) => {
        navigate(`/hotels/${hotelId}${buildHotelSearchQuery(searchParams)}`);
      }}
    />
  );
}

function DetailRoute({
  currentUser,
  onRequireAuth,
}: {
  currentUser: CurrentUser | null;
  onRequireAuth: () => void;
}) {
  const navigate = useNavigate();
  const { hotelId } = useParams();
  const [urlSearchParams] = useSearchParams();
  const searchParams = parseHotelSearchParams(urlSearchParams);
  const parsedHotelId = Number(hotelId);

  if (!Number.isInteger(parsedHotelId) || parsedHotelId <= 0) {
    return (
      <Navigate to={`/hotels${buildHotelSearchQuery(searchParams)}`} replace />
    );
  }

  return (
    <MobileHotelDetail
      key={`${parsedHotelId}:${urlSearchParams.toString()}`}
      currentUser={currentUser}
      hotelId={parsedHotelId}
      searchParams={searchParams}
      onBack={() => {
        navigate(`/hotels${buildHotelSearchQuery(searchParams)}`);
      }}
      onRequireAuth={onRequireAuth}
    />
  );
}

function parseHotelSearchParams(
  searchParams: URLSearchParams,
): HotelSearchParams {
  return {
    ...EMPTY_SEARCH_PARAMS,
    city: searchParams.get("city") ?? EMPTY_SEARCH_PARAMS.city,
    keyword: searchParams.get("keyword") ?? EMPTY_SEARCH_PARAMS.keyword,
    checkInDate:
      searchParams.get("checkInDate") ?? EMPTY_SEARCH_PARAMS.checkInDate,
    checkOutDate:
      searchParams.get("checkOutDate") ?? EMPTY_SEARCH_PARAMS.checkOutDate,
  };
}

function buildHotelSearchQuery(searchParams: HotelSearchParams) {
  const query = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    const trimmedValue = value.trim();

    if (trimmedValue) {
      query.set(key, trimmedValue);
    }
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}
