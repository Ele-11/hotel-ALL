import { useState } from "react";
import type { FormEvent } from "react";
import type { HotelSearchParams } from "../../types/hotel";

type UserHotelSearchProps = {
  initialValue: HotelSearchParams;
  onSearch: (value: HotelSearchParams) => void;
};

export function UserHotelSearch({
  initialValue,
  onSearch,
}: UserHotelSearchProps) {
  const [form, setForm] = useState<HotelSearchParams>(initialValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch({
      city: form.city.trim(),
      keyword: form.keyword.trim(),
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
    });
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 text-white shadow-xl shadow-emerald-950/15">
      <div className="grid gap-6 px-5 py-6 sm:px-7 sm:py-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)] lg:items-end">
        <div className="space-y-4">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-emerald-100">
            EASYSTAY MVP
          </span>
          <div className="space-y-3">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              只看已发布酒店的轻量查询入口
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-emerald-50/85 sm:text-base">
              按城市、地点或关键字搜索酒店，再带着入住日期进入列表和详情。当前里程碑只实现查询与浏览，不创建预订。
            </p>
          </div>
          <div className="grid gap-3 text-sm text-emerald-50/85 sm:grid-cols-3">
            <FeaturePill label="城市 / 地点" />
            <FeaturePill label="关键字检索" />
            <FeaturePill label="详情看房型" />
          </div>
        </div>

        <form
          className="rounded-[24px] border border-white/10 bg-white/95 p-4 text-slate-900 shadow-2xl shadow-emerald-950/10 backdrop-blur"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-3">
            <Field
              label="城市或地点"
              placeholder="例如：杭州西湖 / 上海外滩"
              value={form.city}
              onChange={(value) =>
                setForm((current) => ({ ...current, city: value }))
              }
            />
            <Field
              label="关键字"
              placeholder="例如：君亭、湖景、商务"
              value={form.keyword}
              onChange={(value) =>
                setForm((current) => ({ ...current, keyword: value }))
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="入住日期"
                type="date"
                value={form.checkInDate}
                onChange={(value) =>
                  setForm((current) => ({ ...current, checkInDate: value }))
                }
              />
              <Field
                label="离店日期"
                type="date"
                value={form.checkOutDate}
                onChange={(value) =>
                  setForm((current) => ({ ...current, checkOutDate: value }))
                }
              />
            </div>
          </div>

          <button
            className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            type="submit"
          >
            搜索已发布酒店
          </button>
        </form>
      </div>
    </section>
  );
}

function FeaturePill({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
      {label}
    </div>
  );
}

type FieldProps = {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
};

function Field({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
