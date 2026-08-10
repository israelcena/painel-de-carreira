"use client";

import { ArchiveRestore, Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { unarchiveApplication } from "@/app/actions/applications";
import { SECTION_LABELS } from "@/lib/domain";
import {
  describeEvent,
  EVENT_COLORS,
  EVENT_TYPE_LABELS,
} from "@/lib/events";
import { formatDateTime, relativeTime } from "@/lib/format";
import type { EventDTO, Section, StageDTO } from "@/lib/types";
import { useSearchQuery } from "@/lib/useSearchQuery";
import { inputCls } from "@/components/ui/fields";
import { Flag } from "@/components/ui/Flag";

export interface HistoryEvent extends EventDTO {
  application: {
    id: string;
    company: string;
    roleTitle: string;
    section: Section;
    countryCode: string | null;
    archived: boolean;
  };
}

function UnarchiveButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await unarchiveApplication(id);
        })
      }
      className="flex shrink-0 items-center gap-1 rounded-lg bg-panel px-2.5 py-1 text-[11px] font-extrabold text-ink-soft transition hover:bg-brand/10 hover:text-brand disabled:opacity-60"
    >
      {pending ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <ArchiveRestore size={12} />
      )}
      Desarquivar
    </button>
  );
}

export function HistoryList({
  events,
  stages,
}: {
  events: HistoryEvent[];
  stages: StageDTO[];
}) {
  const [secao, setSecao] = useState<"" | Section>("");
  const [tipo, setTipo] = useState("");
  const q = useSearchQuery().trim().toLowerCase();

  const stageNameById = useMemo(
    () => Object.fromEntries(stages.map((s) => [s.id, s.name])),
    [stages]
  );

  const filtered = events.filter((event) => {
    if (secao && event.application.section !== secao) return false;
    if (tipo && event.type !== tipo) return false;
    if (
      q &&
      !event.application.company.toLowerCase().includes(q) &&
      !event.application.roleTitle.toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 md:gap-3">
        <h1 className="mr-1 text-lg font-extrabold tracking-tight text-ink md:text-xl">
          Histórico
        </h1>
        <select
          value={secao}
          onChange={(e) => setSecao(e.target.value as "" | Section)}
          className={`${inputCls} w-auto`}
          aria-label="Filtrar por seção"
        >
          <option value="">Todas as seções</option>
          {(Object.keys(SECTION_LABELS) as Section[]).map((s) => (
            <option key={s} value={s}>
              {SECTION_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className={`${inputCls} w-auto`}
          aria-label="Filtrar por tipo de evento"
        >
          <option value="">Todos os eventos</option>
          {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <span className="text-xs font-bold text-ink-soft">
          {filtered.length} {filtered.length === 1 ? "evento" : "eventos"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-muted">
            Nenhum evento encontrado com os filtros atuais.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((event) => (
            <li
              key={event.id}
              className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-card"
            >
              <span
                className="mt-1.5 size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: EVENT_COLORS[event.type] ?? "#8a92b2",
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold leading-snug text-ink">
                  {event.application.company}
                  <span className="font-semibold text-ink-soft">
                    {" "}
                    — {event.application.roleTitle}
                  </span>
                  {event.application.countryCode && (
                    <Flag
                      code={event.application.countryCode}
                      className="ml-1.5 inline h-3 w-[1.125rem] rounded-[2px] align-baseline"
                    />
                  )}
                </p>
                <p className="text-xs font-semibold leading-snug text-ink-soft">
                  {describeEvent(event, stageNameById)}
                </p>
                <p
                  className="mt-0.5 text-[11px] font-bold text-muted"
                  title={formatDateTime(event.createdAt)}
                >
                  {formatDateTime(event.createdAt)} ·{" "}
                  {relativeTime(event.createdAt)} ·{" "}
                  {SECTION_LABELS[event.application.section]}
                </p>
              </div>
              {event.type === "ARCHIVED" && event.application.archived && (
                <UnarchiveButton id={event.application.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
