"use client";

import { Check, Loader2, Target } from "lucide-react";
import { useState, useTransition } from "react";
import { saveWeeklyGoal } from "@/app/actions/settings";

export function WeeklyGoalCard({
  goal,
  count,
}: {
  goal: number;
  count: number;
}) {
  const [value, setValue] = useState(String(goal));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pct = Math.min(100, Math.round((count / goal) * 100));
  const reached = count >= goal;

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveWeeklyGoal(Number(value));
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-ink-soft">
        <Target size={15} strokeWidth={2.5} /> Meta da semana
      </h2>

      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold leading-none text-ink">
          {count}
        </span>
        <span className="text-sm font-bold text-muted">
          de {goal} aplicações
        </span>
        {reached && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-600">
            <Check size={12} strokeWidth={3} /> Meta batida!
          </span>
        )}
      </div>

      {/* Barra de progresso com rótulo visível (semana atual, seg–dom) */}
      <div
        className="h-3 rounded-full bg-panel-strong"
        role="progressbar"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-label="Progresso da meta semanal"
      >
        <div
          className={`h-3 rounded-full transition-all ${
            reached
              ? "bg-emerald-500"
              : "bg-gradient-to-r from-brand-violet to-brand-blue"
          }`}
          style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] font-bold text-muted">
        {pct}% · semana atual (segunda a domingo)
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="mt-3 flex items-center gap-2"
      >
        <label
          htmlFor="weekly-goal"
          className="text-[11px] font-bold uppercase tracking-wide text-muted"
        >
          Ajustar meta
        </label>
        <input
          id="weekly-goal"
          type="number"
          min={1}
          max={200}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-20 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-sm font-extrabold text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="submit"
          disabled={pending || Number(value) === goal}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-extrabold text-white transition hover:brightness-105 disabled:opacity-40"
        >
          {pending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            "Salvar"
          )}
        </button>
      </form>
      {error && (
        <p className="mt-1.5 text-[11px] font-bold text-red-500">{error}</p>
      )}
    </section>
  );
}
