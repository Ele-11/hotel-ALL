import { useEffect, useState } from "react";
import { AuthForm } from "../../components/auth/AuthForm";
import { useAuthStore } from "../../stores/auth-store";
import { AdminHotelAuditManager } from "../admin/AdminHotelAuditManager";
import { MerchantHotelManager } from "../merchant/MerchantHotelManager";

export function PortalView() {
  const { currentUser, logout, restore, status, token } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const isRestoring = status === "loading" && Boolean(token) && !currentUser;

  useEffect(() => {
    void restore();
  }, [restore]);

  return (
    <main className="min-h-screen bg-[#f6efe2] px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {currentUser?.role === "MERCHANT" ? (
          <>
            <PortalHeader
              role={currentUser.role}
              username={currentUser.username}
              onLogout={logout}
            />
            <MerchantHotelManager />
          </>
        ) : currentUser?.role === "ADMIN" ? (
          <>
            <PortalHeader
              role={currentUser.role}
              username={currentUser.username}
              onLogout={logout}
            />
            <AdminHotelAuditManager />
          </>
        ) : currentUser?.role === "USER" ? (
          <section className="mx-auto w-full max-w-md rounded-[28px] border border-[#e6dccb] bg-white p-6 shadow-sm shadow-[#dbcdb8]/30">
            <h2 className="text-xl font-semibold text-slate-950">
              商户与管理员后台
            </h2>
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              当前账号无后台访问权限。
            </div>
            <button
              className="mt-5 w-full rounded-2xl border border-[#d9ccb7] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#faf5ec]"
              type="button"
              onClick={logout}
            >
              切换账号
            </button>
          </section>
        ) : (
          <section className="mx-auto w-full max-w-md rounded-[28px] border border-[#e6dccb] bg-white p-6 shadow-sm shadow-[#dbcdb8]/30">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              商户与管理员后台
            </h1>
            {isRestoring ? (
              <div className="mt-5 rounded-2xl border border-[#e6dccb] bg-[#faf5ec] px-4 py-3 text-sm text-slate-600">
                正在恢复登录状态...
              </div>
            ) : null}
            <div className="mt-5">
              <AuthForm
                mode={mode}
                onModeChange={setMode}
                registerableRoles={["MERCHANT"]}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function PortalHeader({
  onLogout,
  role,
  username,
}: {
  onLogout: () => void;
  role: string;
  username: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-[28px] border border-[#e6dccb] bg-white p-5 shadow-sm shadow-[#dbcdb8]/30 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          商户与管理员后台
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {username} / {role}
        </p>
      </div>
      <button
        className="rounded-2xl border border-[#d9ccb7] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#faf5ec]"
        type="button"
        onClick={onLogout}
      >
        退出登录
      </button>
    </section>
  );
}
