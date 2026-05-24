import { useEffect, useMemo, useState } from 'react'
import {
  approveAuditHotel,
  getApiErrorMessage,
  getAuditHotels,
  offlineAuditHotel,
  publishAuditHotel,
  rejectAuditHotel,
} from '../../apis'
import type { AdminHotel } from '../../types/admin'
import type { HotelStatus } from '../../types/merchant'

const filterOptions: Array<{ label: string; value: HotelStatus | 'ALL' }> = [
  { label: '全部状态', value: 'ALL' },
  { label: '待审核', value: 'PENDING_REVIEW' },
  { label: '审核不通过', value: 'REJECTED' },
  { label: '审核通过', value: 'APPROVED' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '已下线', value: 'OFFLINE' },
]

const statusMeta: Record<HotelStatus, { label: string; className: string }> = {
  PENDING_REVIEW: {
    label: '待审核',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  REJECTED: {
    label: '审核不通过',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  APPROVED: {
    label: '审核通过',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  PUBLISHED: {
    label: '已发布',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  OFFLINE: {
    label: '已下线',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  },
}

export function AdminHotelAuditManager() {
  const [hotels, setHotels] = useState<AdminHotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<HotelStatus | 'ALL'>('ALL')
  const [rejectReason, setRejectReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const selectedHotel = useMemo(
    () => hotels.find((hotel) => hotel.id === selectedHotelId) ?? null,
    [hotels, selectedHotelId],
  )

  async function loadHotels(
    nextFilter: HotelStatus | 'ALL' = statusFilter,
    preferredHotelId?: number,
  ) {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getAuditHotels({ status: nextFilter })
      const candidateId = preferredHotelId ?? selectedHotelId
      const nextSelectedHotel =
        data.find((hotel) => hotel.id === candidateId) ?? data[0] ?? null

      setHotels(data)
      setSelectedHotelId(nextSelectedHotel?.id ?? null)
      setRejectReason(nextSelectedHotel?.rejectReason ?? '')
    } catch (loadError) {
      setError(getApiErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    getAuditHotels({ status: 'ALL' })
      .then((data) => {
        if (!isActive) {
          return
        }

        const nextSelectedHotel = data[0] ?? null
        setHotels(data)
        setSelectedHotelId(nextSelectedHotel?.id ?? null)
        setRejectReason(nextSelectedHotel?.rejectReason ?? '')
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return
        }

        setError(getApiErrorMessage(loadError))
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  async function handleFilterChange(nextFilter: HotelStatus | 'ALL') {
    setStatusFilter(nextFilter)
    setNotice(null)
    await loadHotels(nextFilter)
  }

  async function handleAction(
    action: 'approve' | 'publish' | 'offline' | 'reject',
  ) {
    if (!selectedHotel) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    setNotice(null)

    try {
      if (action === 'approve') {
        await approveAuditHotel(selectedHotel.id)
        setNotice('酒店已审核通过，待发布。')
      }

      if (action === 'publish') {
        await publishAuditHotel(selectedHotel.id)
        setNotice('酒店已发布。')
      }

      if (action === 'offline') {
        await offlineAuditHotel(selectedHotel.id)
        setNotice('酒店已下线，可再次发布。')
      }

      if (action === 'reject') {
        await rejectAuditHotel(selectedHotel.id, rejectReason)
        setNotice('酒店已驳回。')
      }

      await loadHotels(statusFilter, selectedHotel.id)
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">管理员后台</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            酒店审核与发布
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            审核通过不等于已发布。管理员需要明确执行发布，下线后也只能通过发布恢复。
          </p>
        </div>

        <label className="block lg:w-64">
          <span className="text-sm font-medium text-slate-700">状态筛选</span>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            value={statusFilter}
            onChange={(event) =>
              void handleFilterChange(event.target.value as HotelStatus | 'ALL')
            }
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice ? (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          正在加载审核列表...
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            {hotels.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                当前筛选条件下暂无酒店。
              </div>
            ) : (
              hotels.map((hotel) => (
                <button
                  className={`w-full rounded-lg border bg-white p-4 text-left shadow-sm transition ${
                    selectedHotelId === hotel.id
                      ? 'border-emerald-300 ring-2 ring-emerald-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  key={hotel.id}
                  type="button"
                  onClick={() => {
                    setSelectedHotelId(hotel.id)
                    setRejectReason(hotel.rejectReason ?? '')
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-950">
                          {hotel.nameCn}
                        </h3>
                        <StatusBadge status={hotel.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {hotel.nameEn}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>商户 #{hotel.merchantId}</p>
                      <p className="mt-1">{hotel.starRating} 星</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">{hotel.address}</p>

                  {hotel.rejectReason ? (
                    <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      驳回原因：{hotel.rejectReason}
                    </p>
                  ) : null}
                </button>
              ))
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            {selectedHotel ? (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleAction('reject')
                }}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-950">
                      {selectedHotel.nameCn}
                    </h3>
                    <StatusBadge status={selectedHotel.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedHotel.nameEn}
                  </p>
                </div>

                <dl className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">地址</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {selectedHotel.address}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">商户 ID</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {selectedHotel.merchantId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">星级</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {selectedHotel.starRating} 星
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">开业时间</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {selectedHotel.openedAt.slice(0, 10)}
                    </dd>
                  </div>
                </dl>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">审核动作</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <ActionButton
                      disabled={
                        isSubmitting ||
                        selectedHotel.status !== 'PENDING_REVIEW'
                      }
                      label="审核通过"
                      onClick={() => void handleAction('approve')}
                    />
                    <ActionButton
                      disabled={
                        isSubmitting ||
                        (selectedHotel.status !== 'APPROVED' &&
                          selectedHotel.status !== 'OFFLINE')
                      }
                      label={
                        selectedHotel.status === 'OFFLINE'
                          ? '恢复发布'
                          : '发布酒店'
                      }
                      onClick={() => void handleAction('publish')}
                    />
                    <ActionButton
                      disabled={
                        isSubmitting || selectedHotel.status !== 'PUBLISHED'
                      }
                      label="下线酒店"
                      onClick={() => void handleAction('offline')}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-900">
                      驳回原因
                    </span>
                    <textarea
                      className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="填写审核不通过原因"
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                    />
                  </label>

                  <button
                    className="mt-3 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={
                      isSubmitting ||
                      (selectedHotel.status !== 'PENDING_REVIEW' &&
                        selectedHotel.status !== 'APPROVED')
                    }
                    type="submit"
                  >
                    {isSubmitting ? '处理中...' : '驳回酒店'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                从左侧选择一个酒店后处理审核。
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function StatusBadge({ status }: { status: HotelStatus }) {
  const meta = statusMeta[status]

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  )
}

function ActionButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  )
}
