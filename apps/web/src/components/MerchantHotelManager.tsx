import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createMerchantHotel,
  createMerchantRoom,
  getApiErrorMessage,
  getMerchantHotels,
  updateMerchantHotel,
  updateMerchantRoom,
} from '../lib/api'
import type {
  HotelStatus,
  MerchantHotel,
  MerchantHotelInput,
  MerchantRoom,
  MerchantRoomInput,
} from '../types/merchant'

type HotelFormState = {
  nameCn: string
  nameEn: string
  address: string
  starRating: string
  openedAt: string
  imageUrl: string
  facilities: string
}

type RoomFormState = {
  name: string
  price: string
}

const emptyHotelForm: HotelFormState = {
  nameCn: '',
  nameEn: '',
  address: '',
  starRating: '5',
  openedAt: '',
  imageUrl: '',
  facilities: '',
}

const emptyRoomForm: RoomFormState = {
  name: '',
  price: '',
}

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

function toDateInputValue(value: string) {
  return value ? value.slice(0, 10) : ''
}

function formatPrice(value: string) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return value
  }

  return amount.toLocaleString('zh-CN', {
    currency: 'CNY',
    style: 'currency',
  })
}

function toFacilities(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getHotelFormPayload(form: HotelFormState): MerchantHotelInput {
  return {
    nameCn: form.nameCn.trim(),
    nameEn: form.nameEn.trim(),
    address: form.address.trim(),
    starRating: Number(form.starRating),
    openedAt: form.openedAt,
    imageUrl: form.imageUrl.trim() || null,
    facilities: toFacilities(form.facilities),
  }
}

function getRoomFormPayload(
  form: RoomFormState,
  hotelId?: number,
): MerchantRoomInput {
  return {
    hotelId,
    name: form.name.trim(),
    price: Number(form.price),
  }
}

function getHotelForm(hotel: MerchantHotel): HotelFormState {
  return {
    nameCn: hotel.nameCn,
    nameEn: hotel.nameEn,
    address: hotel.address,
    starRating: String(hotel.starRating),
    openedAt: toDateInputValue(hotel.openedAt),
    imageUrl: hotel.imageUrl ?? '',
    facilities: hotel.facilities.join(', '),
  }
}

function getRoomForm(room: MerchantRoom): RoomFormState {
  return {
    name: room.name,
    price: String(room.price),
  }
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

export function MerchantHotelManager() {
  const [hotels, setHotels] = useState<MerchantHotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [editingHotelId, setEditingHotelId] = useState<number | null>(null)
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null)
  const [hotelForm, setHotelForm] = useState<HotelFormState>(emptyHotelForm)
  const [roomForm, setRoomForm] = useState<RoomFormState>(emptyRoomForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isHotelSubmitting, setIsHotelSubmitting] = useState(false)
  const [isRoomSubmitting, setIsRoomSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function applyHotels(data: MerchantHotel[], preferredHotelId?: number) {
    setHotels(data)
    setSelectedHotelId((currentId) => {
      const targetId = preferredHotelId ?? currentId
      const hasTarget = data.some((hotel) => hotel.id === targetId)

      if (hasTarget && targetId) {
        return targetId
      }

      return data[0]?.id ?? null
    })
  }

  async function loadHotels(preferredHotelId?: number) {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getMerchantHotels()
      applyHotels(data, preferredHotelId)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    getMerchantHotels()
      .then((data) => {
        if (isActive) {
          applyHotels(data)
        }
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(getApiErrorMessage(loadError))
        }
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

  const selectedHotel = useMemo(
    () => hotels.find((hotel) => hotel.id === selectedHotelId) ?? null,
    [hotels, selectedHotelId],
  )

  function handleEditHotel(hotel: MerchantHotel) {
    setSelectedHotelId(hotel.id)
    setEditingHotelId(hotel.id)
    setHotelForm(getHotelForm(hotel))
    setNotice(null)
    setError(null)
  }

  function handleNewHotel() {
    setEditingHotelId(null)
    setHotelForm(emptyHotelForm)
    setNotice(null)
    setError(null)
  }

  function handleEditRoom(room: MerchantRoom) {
    setEditingRoomId(room.id)
    setRoomForm(getRoomForm(room))
    setNotice(null)
    setError(null)
  }

  function handleNewRoom() {
    setEditingRoomId(null)
    setRoomForm(emptyRoomForm)
    setNotice(null)
    setError(null)
  }

  async function handleHotelSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsHotelSubmitting(true)
    setError(null)
    setNotice(null)

    try {
      const payload = getHotelFormPayload(hotelForm)
      const savedHotel =
        editingHotelId === null
          ? await createMerchantHotel(payload)
          : await updateMerchantHotel(editingHotelId, payload)

      setEditingHotelId(savedHotel.id)
      setHotelForm(getHotelForm(savedHotel))
      setNotice('酒店已保存，并进入待审核状态。')
      await loadHotels(savedHotel.id)
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    } finally {
      setIsHotelSubmitting(false)
    }
  }

  async function handleRoomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedHotel) {
      return
    }

    setIsRoomSubmitting(true)
    setError(null)
    setNotice(null)

    try {
      const payload = getRoomFormPayload(
        roomForm,
        editingRoomId === null ? selectedHotel.id : undefined,
      )

      if (editingRoomId === null) {
        await createMerchantRoom(payload)
      } else {
        await updateMerchantRoom(editingRoomId, payload)
      }

      setEditingRoomId(null)
      setRoomForm(emptyRoomForm)
      setNotice('房型已保存，酒店已重新进入待审核状态。')
      await loadHotels(selectedHotel.id)
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    } finally {
      setIsRoomSubmitting(false)
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            商户后台
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            酒店与房型管理
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            保存酒店或房型后，酒店会进入待审核状态；只有管理员审核并发布后，用户端才可见。
          </p>
        </div>
        <button
          className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          disabled={isHotelSubmitting || isRoomSubmitting}
          type="button"
          onClick={handleNewHotel}
        >
          新建酒店
        </button>
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
          正在加载商户酒店...
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            {hotels.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                暂无酒店。先创建酒店，再选中酒店维护房型和价格。
              </div>
            ) : (
              hotels.map((hotel) => (
                <article
                  className={`rounded-lg border bg-white p-4 shadow-sm transition ${
                    selectedHotelId === hotel.id
                      ? 'border-emerald-300 ring-2 ring-emerald-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  key={hotel.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <button
                      className="min-w-0 text-left"
                      type="button"
                      onClick={() => {
                        setSelectedHotelId(hotel.id)
                        handleNewRoom()
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-950">
                          {hotel.nameCn}
                        </h3>
                        <StatusBadge status={hotel.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {hotel.nameEn}
                      </p>
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      type="button"
                      onClick={() => handleEditHotel(hotel)}
                    >
                      编辑酒店
                    </button>
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-slate-500">地址</dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        {hotel.address}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">星级</dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        {hotel.starRating}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">房型</dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        {hotel.roomTypes.length}
                      </dd>
                    </div>
                  </dl>

                  {hotel.rejectReason ? (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      驳回原因：{hotel.rejectReason}
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        房型列表
                      </p>
                      <span className="text-xs text-slate-500">
                        共 {hotel.roomTypes.length} 个
                      </span>
                    </div>
                    {hotel.roomTypes.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">
                        当前酒店暂无房型。
                      </p>
                    ) : (
                      <div className="mt-3 grid gap-2">
                        {hotel.roomTypes.map((room) => (
                          <div
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                            key={room.id}
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {room.name}
                              </p>
                              <p className="text-sm text-emerald-700">
                                {formatPrice(room.price)}
                              </p>
                            </div>
                            <button
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              type="button"
                              onClick={() => {
                                setSelectedHotelId(hotel.id)
                                handleEditRoom(room)
                              }}
                            >
                              编辑
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="space-y-5">
            <form
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              onSubmit={handleHotelSubmit}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    {editingHotelId === null ? '创建酒店' : '编辑酒店'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    保存后酒店会提交到待审核状态。
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <TextField
                  label="酒店中文名"
                  required
                  value={hotelForm.nameCn}
                  onChange={(value) =>
                    setHotelForm((form) => ({ ...form, nameCn: value }))
                  }
                />
                <TextField
                  label="酒店英文名"
                  required
                  value={hotelForm.nameEn}
                  onChange={(value) =>
                    setHotelForm((form) => ({ ...form, nameEn: value }))
                  }
                />
                <TextField
                  label="酒店地址"
                  required
                  value={hotelForm.address}
                  onChange={(value) =>
                    setHotelForm((form) => ({ ...form, address: value }))
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      酒店星级
                    </span>
                    <select
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      disabled={isHotelSubmitting}
                      required
                      value={hotelForm.starRating}
                      onChange={(event) =>
                        setHotelForm((form) => ({
                          ...form,
                          starRating: event.target.value,
                        }))
                      }
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating}
                        </option>
                      ))}
                    </select>
                  </label>
                  <TextField
                    label="开业时间"
                    placeholder="YYYY-MM-DD"
                    required
                    value={hotelForm.openedAt}
                    onChange={(value) =>
                      setHotelForm((form) => ({ ...form, openedAt: value }))
                    }
                  />
                </div>
                <TextField
                  label="酒店图片 URL"
                  value={hotelForm.imageUrl}
                  onChange={(value) =>
                    setHotelForm((form) => ({ ...form, imageUrl: value }))
                  }
                />
                <TextField
                  label="酒店设施"
                  placeholder="WiFi, 停车场, 早餐"
                  value={hotelForm.facilities}
                  onChange={(value) =>
                    setHotelForm((form) => ({ ...form, facilities: value }))
                  }
                />
              </div>

              <button
                className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isHotelSubmitting || isRoomSubmitting}
                type="submit"
              >
                {isHotelSubmitting ? '保存中...' : '保存并提交审核'}
              </button>
            </form>

            <form
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              onSubmit={handleRoomSubmit}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    {editingRoomId === null ? '创建房型' : '编辑房型'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedHotel
                      ? `当前酒店：${selectedHotel.nameCn}`
                      : '请先选择一个酒店，再添加房型。'}
                  </p>
                </div>
                <button
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400"
                  disabled={!selectedHotel || isRoomSubmitting}
                  type="button"
                  onClick={handleNewRoom}
                >
                  新建房型
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <TextField
                  disabled={!selectedHotel || isRoomSubmitting}
                  label="房型名称"
                  required
                  value={roomForm.name}
                  onChange={(value) =>
                    setRoomForm((form) => ({ ...form, name: value }))
                  }
                />
                <TextField
                  disabled={!selectedHotel || isRoomSubmitting}
                  label="房型价格"
                  min="0"
                  required
                  step="0.01"
                  type="number"
                  value={roomForm.price}
                  onChange={(value) =>
                    setRoomForm((form) => ({ ...form, price: value }))
                  }
                />
              </div>

              <button
                className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!selectedHotel || isHotelSubmitting || isRoomSubmitting}
                type="submit"
              >
                {isRoomSubmitting ? '保存中...' : '保存房型'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

type TextFieldProps = {
  disabled?: boolean
  label: string
  min?: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  step?: string
  type?: string
  value: string
}

function TextField({
  disabled,
  label,
  min,
  onChange,
  placeholder,
  required,
  step,
  type = 'text',
  value,
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        disabled={disabled}
        min={min}
        placeholder={placeholder}
        required={required}
        step={step}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
