"use client";

import {
  CalendarClock,
  CalendarX2,
  Clock,
  Download,
  ExternalLink,
  FileUser,
  Pencil,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { getApplicationEvents } from "@/app/actions/applications";
import { getSwotItems } from "@/app/actions/swot";
import { EventTimeline } from "@/components/history/EventTimeline";
import { SwotGrid } from "@/components/swot/SwotGrid";
import { ErrorBox } from "@/components/ui/fields";
import { Flag } from "@/components/ui/Flag";
import { countryName } from "@/lib/countries";
import {
  PRIORITY_LABELS,
  REJECTION_REASON_LABELS,
  WORK_MODEL_LABELS,
} from "@/lib/domain";
import { daysSince, formatDate, isPastDay } from "@/lib/format";
import type { AppCard, EventDTO, StageDTO, SwotItemDTO } from "@/lib/types";

/** Abas do modo de edição do modal da vaga. */
export type ApplicationTab =
  | "detalhes"
  | "descricao"
  | "curriculo"
  | "swot"
  | "historico";

/** Aviso de vaga rejeitada (quando, de qual etapa e por quê). `children` = ações. */
export function RejectionBanner({
  app,
  stages,
  children,
}: {
  app: AppCard;
  stages: StageDTO[];
  children?: ReactNode;
}) {
  const stage = stages.find((s) => s.id === app.stageId);
  if (!stage?.isRejection || !app.rejectionReason) return null;
  const rejectedFrom = stages.find((s) => s.id === app.rejectedFromStageId);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
      <p className="flex items-center gap-2 text-sm font-extrabold text-red-600">
        <CalendarX2 size={15} />
        Rejeitada em {formatDate(app.rejectedAt)}
        {rejectedFrom ? ` (estava em ${rejectedFrom.name})` : ""}
      </p>
      <p className="mt-1 text-sm font-semibold text-red-500">
        Motivo: {REJECTION_REASON_LABELS[app.rejectionReason]}
        {app.rejectionNote ? ` — ${app.rejectionNote}` : ""}
      </p>
      {children}
    </div>
  );
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="shrink-0 rounded-md p-1 text-muted transition hover:bg-brand/10 hover:text-brand"
    >
      <Pencil size={13} strokeWidth={2.5} />
    </button>
  );
}

function Section({
  title,
  editLabel = `Editar: ${title}`,
  onEdit,
  children,
}: {
  title: string;
  editLabel?: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-muted">
          {title}
        </h3>
        <EditButton label={editLabel} onClick={onEdit} />
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold text-muted">{children}</p>;
}

function Fact({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
      <dt className="text-[11px] font-bold text-muted">{label}</dt>
      <dd className="text-sm font-bold leading-snug wrap-break-word text-ink">
        {value || <span className="text-muted">—</span>}
      </dd>
    </div>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-ink-soft shadow-card transition hover:text-brand"
    >
      <ExternalLink size={14} strokeWidth={2.5} className="shrink-0" />
      <span className="min-w-0">
        <span className="block text-sm font-extrabold">{label}</span>
        <span className="block truncate text-[11px] font-semibold text-muted">
          {hostOf(href)}
        </span>
      </span>
    </a>
  );
}

/** Texto livre com quebras preservadas; os longos começam recortados. */
function LongText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 600 || text.split("\n").length > 10;

  return (
    <div>
      <p
        className={`whitespace-pre-wrap wrap-break-word text-sm font-semibold leading-relaxed text-ink ${
          long && !expanded ? "line-clamp-10" : ""
        }`}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1 text-xs font-extrabold text-brand hover:underline"
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </div>
  );
}

function SwotSummary({ app }: { app: AppCard }) {
  const [items, setItems] = useState<SwotItemDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSwotItems(app.id).then((result) => {
      if (cancelled) return;
      if (result.ok) setItems(result.data ?? []);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [app.id]);

  if (error) return <ErrorBox message={error} />;
  if (items === null) return <Empty>Carregando análise SWOT...</Empty>;
  if (items.length === 0) return <Empty>Nenhum item na análise SWOT.</Empty>;
  return (
    <SwotGrid applicationId={app.id} initialItems={items} compact readOnly />
  );
}

function HistorySummary({
  app,
  stageNameById,
}: {
  app: AppCard;
  stageNameById: Record<string, string>;
}) {
  const [events, setEvents] = useState<EventDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getApplicationEvents(app.id).then((result) => {
      if (cancelled) return;
      if (result.ok) setEvents(result.data ?? []);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [app.id]);

  if (error) return <ErrorBox message={error} />;
  return <EventTimeline events={events} stageNameById={stageNameById} />;
}

/**
 * Visão de leitura da vaga, primeira tela ao clicar no card. Os lápis de cada
 * seção levam ao modo de edição já na aba correspondente.
 */
export function ApplicationView({
  app,
  stages,
  stageNameById,
  onEdit,
}: {
  app: AppCard;
  stages: StageDTO[];
  stageNameById: Record<string, string>;
  onEdit: (tab: ApplicationTab) => void;
}) {
  const stage = stages.find((s) => s.id === app.stageId);
  const days = daysSince(app.stageEnteredAt);
  const overdue = app.nextActionAt !== null && isPastDay(app.nextActionAt);
  const edit = (tab: ApplicationTab) => () => onEdit(tab);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="flex items-center gap-1.5 rounded-full bg-panel px-2.5 py-1 text-xs font-extrabold text-ink">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: stage?.color }}
          />
          {stage?.name ?? "Etapa"}
        </span>
        <span
          className="flex items-center gap-1 text-xs font-bold text-ink-soft"
          title={`Na etapa desde ${formatDate(app.stageEnteredAt)}`}
        >
          <Clock size={12} strokeWidth={2.5} />
          {days === 0
            ? "Entrou hoje nesta etapa"
            : `${days} ${days === 1 ? "dia" : "dias"} nesta etapa`}
        </span>
      </div>

      <RejectionBanner app={app} stages={stages} />

      {(app.nextActionNote || app.nextActionAt) && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3 ${
            overdue ? "border-red-200 bg-red-50" : "border-brand/20 bg-brand/5"
          }`}
        >
          <CalendarClock
            size={16}
            strokeWidth={2.5}
            className={`mt-0.5 shrink-0 ${overdue ? "text-red-500" : "text-brand"}`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
              Próxima ação{overdue ? " · atrasada" : ""}
            </p>
            <p className="text-sm font-extrabold wrap-break-word text-ink">
              {app.nextActionNote ?? "Próxima ação"}
            </p>
            {app.nextActionAt && (
              <p
                className={`text-xs font-bold ${
                  overdue ? "text-red-500" : "text-ink-soft"
                }`}
              >
                {formatDate(app.nextActionAt)}
              </p>
            )}
          </div>
          <EditButton label="Editar: Próxima ação" onClick={edit("detalhes")} />
        </div>
      )}

      {/* A lateral vem antes no DOM: no mobile os dados curtos ficam no topo */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_15rem] 2xl:grid-cols-[minmax(0,1fr)_18rem] 3xl:gap-6">
        <aside className="min-w-0 space-y-4 self-start rounded-xl bg-panel p-3 md:col-start-2 md:row-start-1">
          <Section title="Dados da vaga" onEdit={edit("detalhes")}>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <Fact
                wide
                label="País"
                value={
                  <span className="flex items-center gap-1.5">
                    <Flag
                      code={app.countryCode}
                      className="h-3 w-[1.125rem] shrink-0 rounded-[2px] shadow-sm"
                    />
                    {countryName(app.countryCode)}
                  </span>
                }
              />
              <Fact label="Prioridade" value={PRIORITY_LABELS[app.priority]} />
              <Fact
                label="Modelo"
                value={app.workModel && WORK_MODEL_LABELS[app.workModel]}
              />
              <Fact label="Plataforma" value={app.platform} />
              <Fact label="Cidade" value={app.locationCity} />
              <Fact wide label="Salário / faixa" value={app.salary} />
              <Fact
                label="Aplicada em"
                value={app.appliedAt && formatDate(app.appliedAt)}
              />
              <Fact
                label="Na etapa desde"
                value={formatDate(app.stageEnteredAt)}
              />
              <Fact label="Criada em" value={formatDate(app.createdAt)} />
            </dl>
          </Section>

          <Section title="Links" onEdit={edit("detalhes")}>
            {app.jobUrl || app.applicationUrl ? (
              <div className="space-y-1.5">
                {app.jobUrl && <LinkButton href={app.jobUrl} label="Vaga" />}
                {app.applicationUrl && (
                  <LinkButton href={app.applicationUrl} label="Candidatura" />
                )}
              </div>
            ) : (
              <Empty>Nenhum link salvo.</Empty>
            )}
          </Section>

          <Section title="Currículo" onEdit={edit("curriculo")}>
            {app.resume ? (
              <div className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-card">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                  <FileUser size={15} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">
                    {app.resume.name}
                  </p>
                  <p className="truncate text-[11px] font-semibold text-muted">
                    {app.resume.fileName}
                  </p>
                </div>
                <a
                  href={`/api/documentos/${app.resume.id}`}
                  download={app.resume.fileName}
                  title="Baixar currículo"
                  aria-label="Baixar currículo"
                  className="shrink-0 rounded-md p-1.5 text-muted transition hover:bg-brand/10 hover:text-brand"
                >
                  <Download size={15} strokeWidth={2.5} />
                </a>
              </div>
            ) : (
              <Empty>Nenhum currículo vinculado.</Empty>
            )}
          </Section>
        </aside>

        {/* Telas gigantes: textos numa coluna e SWOT + histórico noutra, para
            as linhas não passarem de ~100 caracteres */}
        <div className="grid min-w-0 grid-cols-1 gap-5 md:col-start-1 md:row-start-1 3xl:grid-cols-2 3xl:gap-x-6">
          <div className="min-w-0 space-y-5">
            <Section title="Descrição da vaga" onEdit={edit("descricao")}>
              {app.jobDescription ? (
                <LongText text={app.jobDescription} />
              ) : (
                <Empty>Nenhuma descrição salva.</Empty>
              )}
            </Section>

            <Section title="Observações" onEdit={edit("detalhes")}>
              {app.notes ? (
                <LongText text={app.notes} />
              ) : (
                <Empty>Sem observações.</Empty>
              )}
            </Section>
          </div>

          <div className="min-w-0 space-y-5">
            <Section title="Análise SWOT" onEdit={edit("swot")}>
              <SwotSummary app={app} />
            </Section>

            <Section
              title="Histórico"
              editLabel="Anotar no histórico"
              onEdit={edit("historico")}
            >
              <HistorySummary app={app} stageNameById={stageNameById} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
