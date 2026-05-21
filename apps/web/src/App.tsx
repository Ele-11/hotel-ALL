import { useEffect, useState } from "react";
import { AdminHotelAuditManager } from "./components/AdminHotelAuditManager";
import { AuthForm } from "./components/AuthForm";
import { MerchantHotelManager } from "./components/MerchantHotelManager";
import { useAuthStore } from "./store/auth-store";

const MOBILE_APP_URL = "http://localhost:5174";

export default function App() {
  const { currentUser, logout, restore, status, token } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const isRestoring = status === "loading" && Boolean(token) && !currentUser;

  useEffect(() => {
    void restore();
  }, [restore]);

  return (
    <main className="min-h-screen bg-[#f6efe2] px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[32px] border border-[#e8dcc7] bg-[linear-gradient(180deg,#fffdfa_0%,#f8f2e7_100%)] p-6 shadow-sm shadow-[#dbcdb8]/50 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold tracking-[0.22em] text-emerald-700">
                EASYSTAY PORTAL
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.4rem]">
                商户与管理员使用的 PC 后台
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Milestone 6 的用户搜索、列表、详情已经拆分到独立移动端运行。
                这里仅保留后台登录、商户酒店管理和管理员审核发布流程。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {currentUser ? (
                <>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                    当前身份：{currentUser.username} / {currentUser.role}
                  </div>
                  <button
                    className="rounded-full border border-[#d9ccb7] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#faf5ec]"
                    type="button"
                    onClick={logout}
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <a
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
                  href={MOBILE_APP_URL}
                >
                  打开移动端：{MOBILE_APP_URL}
                </a>
              )}
            </div>
          </div>

          {isRestoring ? (
            <div className="mt-5 rounded-2xl border border-[#e6dccb] bg-white/80 px-4 py-3 text-sm text-slate-600">
              正在恢复登录状态...
            </div>
          ) : null}
        </section>

        {currentUser?.role === "MERCHANT" ? (
          <MerchantHotelManager />
        ) : currentUser?.role === "ADMIN" ? (
          <AdminHotelAuditManager />
        ) : currentUser?.role === "USER" ? (
          <section className="rounded-[28px] border border-[#e6dccb] bg-white p-6 shadow-sm shadow-[#dbcdb8]/30">
            <h2 className="text-xl font-semibold text-slate-950">
              普通用户请访问移动端
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              用户端已经从后台入口拆出。酒店搜索、列表和详情请在移动端访问；
              PC 后台不再承载普通用户页面。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                className="rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                href={MOBILE_APP_URL}
              >
                前往移动端
              </a>
              <button
                className="rounded-2xl border border-[#d9ccb7] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#faf5ec]"
                type="button"
                onClick={logout}
              >
                切换账号
              </button>
            </div>
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_360px]">
            <section className="space-y-6 rounded-[28px] border border-[#e6dccb] bg-white p-6 shadow-sm shadow-[#dbcdb8]/30">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">
                  后台入口已回归角色边界
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  商户和管理员在这里登录；普通用户的浏览入口单独运行在移动端。
                  这样可以避免登录表单和用户搜索页面出现在同一屏内。
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FeatureCard
                  title="商户后台"
                  description="录入酒店、维护房型价格、查看审核状态。"
                />
                <FeatureCard
                  title="管理员后台"
                  description="审核酒店、发布酒店、下线已发布酒店。"
                />
                <FeatureCard
                  title="用户移动端"
                  description={`单独运行在 ${MOBILE_APP_URL}，只展示用户搜索、列表与详情。`}
                />
                <FeatureCard
                  title="当前范围"
                  description="Milestone 6 不在后台入口混入用户端页面，也不提前接入支付。"
                />
              </div>
            </section>

            <aside className="space-y-6">
              <AuthForm
                mode={mode}
                onModeChange={setMode}
                registerableRoles={["MERCHANT"]}
              />

              <section className="rounded-[28px] border border-[#e6dccb] bg-white p-5 shadow-sm shadow-[#dbcdb8]/30">
                <h2 className="text-base font-semibold text-slate-950">
                  使用说明
                </h2>
                <div className="mt-4 space-y-3">
                  <RoleCard
                    title="商户"
                    description="可注册商户账号，登录后进入酒店录入与房型维护后台。"
                  />
                  <RoleCard
                    title="管理员"
                    description="管理员账号由系统预置，通过登录后进入审核与发布后台。"
                  />
                  <RoleCard
                    title="普通用户"
                    description={`请访问 ${MOBILE_APP_URL}。该地址为移动端用户专用入口。`}
                  />
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function FeatureCard({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <article className="rounded-[24px] border border-[#efe5d6] bg-[#faf5ec] p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function RoleCard({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-[22px] border border-[#efe5d6] bg-[#faf5ec] p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
