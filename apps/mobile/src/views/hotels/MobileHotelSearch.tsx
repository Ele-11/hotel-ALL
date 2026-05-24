import { useState } from "react";
import type { FormEvent } from "react";
import type { HotelSearchParams } from "../../types/hotel";

type MobileHotelSearchProps = {
  initialValue: HotelSearchParams;
  onSearch: (value: HotelSearchParams) => void;
};

export function MobileHotelSearch({
  initialValue,
  onSearch,
}: MobileHotelSearchProps) {
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
    <section className="rounded-[30px] border border-[#e4d9c5] bg-white p-5 shadow-sm shadow-[#d8ccb7]/35">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field
          label="城市或地点"
          placeholder="例如：杭州西湖 / 上海外滩"
          value={form.city}
          onChange={(value) =>
            setForm((current) => ({ ...current, city: value }))
          }
        />
        <Field
          label="关键词"
          placeholder="例如：君亭、湖景、商务"
          value={form.keyword}
          onChange={(value) =>
            setForm((current) => ({ ...current, keyword: value }))
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
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

        <button
          className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          type="submit"
        >
          搜索酒店
        </button>
      </form>
    </section>
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
        className="mt-2 w-full rounded-2xl border border-[#e4d9c5] bg-[#fffdfa] px-3 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
