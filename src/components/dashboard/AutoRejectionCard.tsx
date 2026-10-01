"use client";

import { Hourglass, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveAutoRejection } from "@/app/actions/settings";
import { IDLE_LIMIT_MAX, IDLE_LIMIT_MIN } from "@/lib/autoRejection";

export function AutoRejectionCard({
  enabled,
  days,
}: {
  enabled: boolean;
  days: number;
}) {
  const [on, setOn] = useState(enabled);
  const [value, setValue] = useState(String(days));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const changed = on !== enabled || Number(value) !== days;

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveAutoRejection({
        enabled: on,
        days: Number(value),
      });
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-ink-soft">
        <Hourglass size={15} strokeWidth={2.5} /> Rejeição automática
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label="Rejeição automática"
            onClick={() => setOn((current) => !current)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${
              on ? "bg-brand" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                on ? "translate-x-5.5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-sm font-extrabold text-ink">
            {on ? "Ativada" : "Desativada"}
          </span>
        </div>

        <label
          htmlFor="idle-limit"
          className={`mt-3 flex flex-wrap items-center gap-2 text-sm font-bold ${
            on ? "text-ink" : "text-muted"
          }`}
        >
          Mover para Rejeitado vagas paradas há
          <input
            id="idle-limit"
            type="number"
            min={IDLE_LIMIT_MIN}
            max={IDLE_LIMIT_MAX}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-16 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-sm font-extrabold text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/30"
          />
          {Number(value) === 1 ? "dia" : "dias"}
        </label>

        <p className="mt-2 text-[11px] font-semibold text-muted">
          A contagem começa na data mais recente entre a entrada na etapa, a
          Próxima ação e o desarquivamento. Vale para as etapas de Aplicado a
          Oferta; Interesse e arquivadas ficam de fora. Ao ativar ou reduzir o
          prazo, as vagas que já passaram dele vão para Rejeitado.
        </p>

        <button
          type="submit"
          disabled={pending || !changed}
          className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-extrabold text-white transition hover:brightness-105 disabled:opacity-40"
        >
          {pending ? <Loader2 size={13} className="animate-spin" /> : "Salvar"}
        </button>
      </form>
      {error && (
        <p className="mt-1.5 text-[11px] font-bold text-red-500">{error}</p>
      )}
    </section>
  );
}
