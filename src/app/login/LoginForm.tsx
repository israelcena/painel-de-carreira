"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { login } from "@/app/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="user"
          className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted"
        >
          Usuário
        </label>
        <input
          id="user"
          name="user"
          type="text"
          autoComplete="username"
          required
          autoFocus
          className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/30"
          placeholder="admin"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted"
        >
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 pr-10 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/30"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted transition hover:text-ink"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {state?.error && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
          <CircleAlert size={16} /> {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-brand-violet to-brand-blue py-2.5 text-sm font-extrabold text-white shadow-card transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
