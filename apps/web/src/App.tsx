import { useEffect, useState } from 'react'
import { AuthForm } from './components/AuthForm'
import { useAuthStore } from './store/auth-store'

const roleLabel = {
  USER: '普通用户',
  MERCHANT: '商户',
  ADMIN: '管理员',
}

const roleDestinations = {
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:grid lg:grid-cols-[1fr_380px] lg:items-start">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
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
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              正在恢复登录状态
            </div>
          ) : null}

          {currentUser ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">当前身份</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold text-emerald-950">
                    {currentUser.username}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    {roleLabel[currentUser.role]}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {roleDestinations[currentUser.role].map((item) => (
                  <div
                    className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  普通用户
                </p>
                <p className="mt-2 text-sm text-slate-600">酒店查询与预订</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">商户</p>
                <p className="mt-2 text-sm text-slate-600">酒店与房型管理</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">管理员</p>
                <p className="mt-2 text-sm text-slate-600">审核与发布管理</p>
              </div>
            </div>
          )}
        </section>

        {!currentUser ? (
          <AuthForm mode={mode} onModeChange={setMode} />
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              登录状态
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">用户 ID</dt>
                <dd className="font-medium text-slate-900">{currentUser.id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">角色</dt>
                <dd className="font-medium text-slate-900">
                  {currentUser.role}
                </dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </main>
  )
}

export default App
