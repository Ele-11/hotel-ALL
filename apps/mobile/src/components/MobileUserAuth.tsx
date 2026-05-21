import { useState } from "react";
import type { FormEvent } from "react";

type AuthMode = "login" | "register";

type MobileUserAuthProps = {
  error: string | null;
  isSubmitting: boolean;
  mode: AuthMode;
  onClose?: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onModeChange: (mode: AuthMode) => void;
  onRegister: (username: string, password: string) => Promise<void>;
};

export function MobileUserAuth({
  error,
  isSubmitting,
  mode,
  onClose,
  onLogin,
  onModeChange,
  onRegister,
}: MobileUserAuthProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "login") {
      await onLogin(username, password);
      return;
    }

    await onRegister(username, password);
  }

  return (
    <section className="rounded-[30px] border border-[#e4d9c5] bg-white shadow-sm shadow-[#d8ccb7]/35">
      <div className="flex items-start justify-between gap-4 border-b border-[#efe5d6] bg-[linear-gradient(180deg,#faf4e7_0%,#f4ebdb_100%)] px-5 py-5">
        <div>
          <span className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold tracking-[0.2em] text-emerald-700">
            USER AUTH
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            普通用户登录与注册
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            游客可以继续浏览酒店；只有普通用户登录后才能创建预订记录。
          </p>
        </div>
        {onClose ? (
          <button
            className="rounded-2xl border border-[#d9ccb7] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#fff8ee]"
            type="button"
            onClick={onClose}
          >
            收起
          </button>
        ) : null}
      </div>

      <div className="px-5 py-5">
        <div className="grid grid-cols-2 rounded-2xl border border-[#efe5d6] bg-[#faf5ec] p-1">
          <button
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            type="button"
            onClick={() => onModeChange("login")}
          >
            登录
          </button>
          <button
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              mode === "register"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            type="button"
            onClick={() => onModeChange("register")}
          >
            注册
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <Field
            label="用户名"
            value={username}
            onChange={(value) => setUsername(value)}
          />
          <Field
            label="密码"
            type="password"
            value={password}
            onChange={(value) => setPassword(value)}
          />

          <div className="rounded-2xl border border-[#efe5d6] bg-[#faf5ec] px-4 py-3 text-sm text-slate-600">
            {mode === "login"
              ? "登录后可以在酒店详情页选择房型并创建预订记录。"
              : "这里只注册普通用户账号，不开放商户或管理员注册。"}
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "提交中..."
              : mode === "login"
                ? "登录普通用户"
                : "注册并登录"}
          </button>
        </form>
      </div>
    </section>
  );
}

type FieldProps = {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
};

function Field({ label, onChange, type = "text", value }: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-2 w-full rounded-2xl border border-[#e4d9c5] bg-[#fffdfa] px-3 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
