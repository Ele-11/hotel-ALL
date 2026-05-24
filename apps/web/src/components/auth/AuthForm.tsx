import { useState } from "react";
import type { FormEvent } from "react";
import { useAuthStore } from "../../stores/auth-store";
import type { Role } from "../../types/auth";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  registerableRoles?: Array<Exclude<Role, "ADMIN">>;
};

const roleLabels: Record<Exclude<Role, "ADMIN">, string> = {
  USER: "普通用户",
  MERCHANT: "商户",
};

export function AuthForm({
  mode,
  onModeChange,
  registerableRoles = ["USER", "MERCHANT"],
}: AuthFormProps) {
  const { error, login, register, status } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<Role, "ADMIN">>(
    registerableRoles[0] ?? "USER",
  );
  const isSubmitting = status === "loading";
  const activeRole = registerableRoles.includes(role)
    ? role
    : (registerableRoles[0] ?? "USER");
  const roleOptions = registerableRoles.map((value) => ({
    label: roleLabels[value],
    value,
  }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "login") {
      await login(username, password);
      return;
    }

    await register(username, password, activeRole);
  }

  return (
    <section className="rounded-[28px] border border-[#e6dccb] bg-white p-5 shadow-sm shadow-[#d8ccb7]/40">
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
        <label className="block">
          <span className="text-sm font-medium text-slate-700">用户名</span>
          <input
            className="mt-2 w-full rounded-2xl border border-[#e6dccb] bg-[#fffdfa] px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">密码</span>
          <input
            className="mt-2 w-full rounded-2xl border border-[#e6dccb] bg-[#fffdfa] px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {mode === "register" ? (
          registerableRoles.length > 1 ? (
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">
                注册角色
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {roleOptions.map((option) => (
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                      activeRole === option.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-[#e6dccb] text-slate-600 hover:border-[#d3c5af]"
                    }`}
                    key={option.value}
                  >
                    <input
                      checked={activeRole === option.value}
                      className="sr-only"
                      name="role"
                      type="radio"
                      value={option.value}
                      onChange={() => setRole(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="rounded-2xl border border-[#efe5d6] bg-[#faf5ec] px-4 py-3 text-sm text-slate-600">
              注册后将创建{roleLabels[registerableRoles[0]]}账号。
            </div>
          )
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          className="w-full rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "提交中..." : mode === "login" ? "登录" : "注册并登录"}
        </button>
      </form>
    </section>
  );
}
