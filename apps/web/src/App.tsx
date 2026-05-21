import { useEffect, useState } from 'react'
import { AuthForm } from './components/AuthForm'
import { MerchantHotelManager } from './components/MerchantHotelManager'
import { useAuthStore } from './store/auth-store'
import type { Role } from './types/auth'

const roleLabel: Record<Role, string> = {
  USER: '普通用户',
  MERCHANT: '商户',
  ADMIN: '管理员',
}

const roleDestinations: Record<Role, string[]> = {
  USER: ['查询酒店', '查看酒店详情', '创建基础预订'],
  MERCHANT: ['查看我的酒店', '维护酒店与房型', '查看审核状态'],
  ADMIN: ['查看待审核酒店', '审核与驳回', '发布与下线'],
}

function App() {
  const { currentUser, logout, restore, status, token } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const isRestoring = status === 'loading' && Boolean(token) && !currentUser

  useEffect(() => {
    void restore()
  }, [restore])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                易宿酒店预订平台
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                账号与权限
              </h1>
            </div>
            {currentUser ? (
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                type="button"
                onClick={logout}
              >
                退出
              </button>
            ) : null}
          </div>

          {isRestoring ? (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              正在恢复登录状态
            </div>
          ) : null}

          {currentUser ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <span className="text-sm text-emerald-700">当前身份</span>
              <span className="font-semibold text-emerald-950">
                {currentUser.username}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {roleLabel[currentUser.role]}
              </span>
            </div>
          ) : null}
        </section>

        {!currentUser ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-3">
                <RoleCard title="普通用户" description="酒店查询与预订" />
                <RoleCard title="商户" description="酒店与房型管理" />
                <RoleCard title="管理员" description="审核与发布管理" />
              </div>
            </section>
            <AuthForm mode={mode} onModeChange={setMode} />
          </div>
        ) : currentUser.role === 'MERCHANT' ? (
          <MerchantHotelManager />
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">功能入口</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {roleDestinations[currentUser.role].map((item) => (
                <div
                  className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function RoleCard({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  )
}

export default App
