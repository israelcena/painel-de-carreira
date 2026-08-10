"use client";

import {
  Archive,
  CalendarX2,
  CornerUpLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  addNote,
  archiveApplication,
  deleteApplication,
  getApplicationEvents,
  updateApplication,
} from "@/app/actions/applications";
import { getSwotItems } from "@/app/actions/swot";
import { SwotGrid } from "@/components/swot/SwotGrid";
import {
  PLATFORM_SUGGESTIONS,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  REJECTION_REASON_LABELS,
  SECTION_LABELS,
  WORK_MODEL_LABELS,
} from "@/lib/domain";
import { describeEvent, EVENT_COLORS } from "@/lib/events";
import {
  dateToInput,
  formatDate,
  formatDateTime,
  relativeTime,
} from "@/lib/format";
import type {
  AppCard,
  EventDTO,
  Priority,
  Section,
  StageDTO,
  SwotItemDTO,
  WorkModel,
} from "@/lib/types";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { ErrorBox, Field, inputCls } from "@/components/ui/fields";
import { Flag } from "@/components/ui/Flag";
import { Modal } from "@/components/ui/Modal";
import { PriorityPill } from "@/components/ui/PriorityPill";

function DetailsTab({
  app,
  stages,
  onClose,
  onMove,
}: {
  app: AppCard;
  stages: StageDTO[];
  onClose: () => void;
  onMove: (app: AppCard, toStageId: string) => void;
}) {
  const [section, setSection] = useState<Section>(app.section);
  const [company, setCompany] = useState(app.company);
  const [roleTitle, setRoleTitle] = useState(app.roleTitle);
  const [priority, setPriority] = useState<Priority>(app.priority);
  const [countryCode, setCountryCode] = useState(app.countryCode ?? "");
  const [platform, setPlatform] = useState(app.platform ?? "");
  const [appliedAt, setAppliedAt] = useState(dateToInput(app.appliedAt));
  const [workModel, setWorkModel] = useState<WorkModel | "">(
    app.workModel ?? ""
  );
  const [locationCity, setLocationCity] = useState(app.locationCity ?? "");
  const [salary, setSalary] = useState(app.salary ?? "");
  const [jobUrl, setJobUrl] = useState(app.jobUrl ?? "");
  const [applicationUrl, setApplicationUrl] = useState(
    app.applicationUrl ?? ""
  );
  const [nextActionNote, setNextActionNote] = useState(
    app.nextActionNote ?? ""
  );
  const [nextActionAt, setNextActionAt] = useState(
    dateToInput(app.nextActionAt)
  );
  const [notes, setNotes] = useState(app.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const stage = stages.find((s) => s.id === app.stageId);
  const rejectedFrom = stages.find((s) => s.id === app.rejectedFromStageId);

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateApplication(app.id, {
        section,
        company,
        roleTitle,
        priority,
        countryCode: countryCode || null,
        platform: platform || null,
        appliedAt: appliedAt || null,
        workModel: workModel || null,
        locationCity: locationCity || null,
        salary: salary || null,
        jobUrl: jobUrl || null,
        applicationUrl: applicationUrl || null,
        nextActionNote: nextActionNote || null,
        nextActionAt: nextActionAt || null,
        notes: notes || null,
      });
      if (result.ok) onClose();
      else setError(result.error);
    });
  };

  const archive = () => {
    startTransition(async () => {
      const result = await archiveApplication(app.id);
      if (result.ok) onClose();
      else setError(result.error);
    });
  };

  const remove = () => {
    if (
      !window.confirm(
        "Excluir permanentemente esta vaga e todo o seu histórico? Essa ação não pode ser desfeita.\n\nDica: use Arquivar para tirá-la do quadro mantendo as métricas."
      )
    )
      return;
    startTransition(async () => {
      const result = await deleteApplication(app.id);
      if (result.ok) onClose();
      else setError(result.error);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-4"
    >
      {stage?.isRejection && app.rejectionReason && (
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
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              onMove(app, app.rejectedFromStageId ?? stages[0]?.id ?? "")
            }
            className="mt-2 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-extrabold text-ink-soft shadow-card transition hover:text-brand"
          >
            <CornerUpLeft size={13} /> Retornar ao funil
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Empresa" htmlFor="ed-company" required>
          <input
            id="ed-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            className={inputCls}
          />
        </Field>
        <Field label="Cargo" htmlFor="ed-role" required>
          <input
            id="ed-role"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            required
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Seção" htmlFor="ed-section">
          <select
            id="ed-section"
            value={section}
            onChange={(e) => setSection(e.target.value as Section)}
            className={inputCls}
          >
            {(Object.keys(SECTION_LABELS) as Section[]).map((key) => (
              <option key={key} value={key}>
                {SECTION_LABELS[key]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mover para etapa" htmlFor="ed-stage">
          <select
            id="ed-stage"
            value={app.stageId}
            onChange={(e) => {
              if (e.target.value !== app.stageId) onMove(app, e.target.value);
            }}
            className={inputCls}
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {section === "INTERNACIONAL" && (
        <Field label="País" htmlFor="ed-country" required>
          <CountrySelect
            id="ed-country"
            value={countryCode}
            onChange={setCountryCode}
            required
          />
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prioridade" htmlFor="ed-priority">
          <select
            id="ed-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={inputCls}
          >
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Data de aplicação" htmlFor="ed-applied">
          <input
            id="ed-applied"
            type="date"
            value={appliedAt}
            onChange={(e) => setAppliedAt(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plataforma" htmlFor="ed-platform">
          <input
            id="ed-platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            list="ed-platforms"
            className={inputCls}
          />
          <datalist id="ed-platforms">
            {PLATFORM_SUGGESTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>
        <Field label="Modelo de trabalho" htmlFor="ed-model">
          <select
            id="ed-model"
            value={workModel}
            onChange={(e) => setWorkModel(e.target.value as WorkModel | "")}
            className={inputCls}
          >
            <option value="">Não informado</option>
            {(Object.keys(WORK_MODEL_LABELS) as WorkModel[]).map((model) => (
              <option key={model} value={model}>
                {WORK_MODEL_LABELS[model]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cidade" htmlFor="ed-city">
          <input
            id="ed-city"
            value={locationCity}
            onChange={(e) => setLocationCity(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Salário / faixa" htmlFor="ed-salary">
          <input
            id="ed-salary"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Link da vaga" htmlFor="ed-url">
          <input
            id="ed-url"
            type="url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://... (anúncio)"
            className={inputCls}
          />
        </Field>
        <Field label="Link da candidatura" htmlFor="ed-app-url">
          <input
            id="ed-app-url"
            type="url"
            value={applicationUrl}
            onChange={(e) => setApplicationUrl(e.target.value)}
            placeholder="https://... (acompanhamento)"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Próxima ação" htmlFor="ed-next-note">
          <input
            id="ed-next-note"
            value={nextActionNote}
            onChange={(e) => setNextActionNote(e.target.value)}
            placeholder="Ex.: fazer follow-up com a recrutadora"
            className={inputCls}
          />
        </Field>
        <Field label="Data da próxima ação" htmlFor="ed-next-date">
          <input
            id="ed-next-date"
            type="date"
            value={nextActionAt}
            onChange={(e) => setNextActionAt(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Observações" htmlFor="ed-notes">
        <textarea
          id="ed-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={`${inputCls} resize-y`}
        />
      </Field>

      <ErrorBox message={error} />

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-gradient-to-r from-brand-violet to-brand-blue px-4 py-2.5 text-sm font-extrabold text-white shadow-card transition hover:brightness-105 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={archive}
          disabled={pending}
          title="Remove do quadro mantendo as métricas"
          className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-extrabold text-ink-soft transition hover:bg-panel disabled:opacity-60"
        >
          <Archive size={15} /> Arquivar
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-extrabold text-red-500 transition hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 size={15} /> Excluir
        </button>
      </div>
    </form>
  );
}

function DescriptionTab({ app }: { app: AppCard }) {
  const [value, setValue] = useState(app.jobDescription ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateApplication(app.id, {
        jobDescription: value || null,
      });
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-3"
    >
      <Field label="Descrição da vaga" htmlFor="desc-text">
        <textarea
          id="desc-text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={14}
          placeholder="Cole aqui o texto completo da vaga: requisitos, responsabilidades, benefícios, processo seletivo..."
          className={`${inputCls} resize-y leading-relaxed`}
        />
      </Field>

      <ErrorBox message={error} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gradient-to-r from-brand-violet to-brand-blue px-5 py-2.5 text-sm font-extrabold text-white shadow-card transition hover:brightness-105 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar descrição"}
        </button>
        {saved && (
          <span className="text-sm font-extrabold text-emerald-600">
            Salvo ✓
          </span>
        )}
      </div>
    </form>
  );
}

function SwotTab({ app }: { app: AppCard }) {
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
  if (items === null) {
    return (
      <p className="py-6 text-center text-sm font-semibold text-muted">
        Carregando análise SWOT...
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-ink-soft">
        Analise o seu fit para <strong>{app.company}</strong>: forças e
        fraquezas do seu perfil para esta vaga, oportunidades e ameaças do
        processo.
      </p>
      <SwotGrid applicationId={app.id} initialItems={items} compact />
    </div>
  );
}

function HistoryTab({
  app,
  stageNameById,
}: {
  app: AppCard;
  stageNameById: Record<string, string>;
}) {
  const [events, setEvents] = useState<EventDTO[] | null>(null);
  const [noteText, setNoteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = async () => {
    const result = await getApplicationEvents(app.id);
    if (result.ok) setEvents(result.data ?? []);
    else setError(result.error);
  };

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

  const submitNote = () => {
    setError(null);
    startTransition(async () => {
      const result = await addNote(app.id, noteText);
      if (result.ok) {
        setNoteText("");
        await load();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitNote();
        }}
        className="flex gap-2"
      >
        <input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Adicionar nota ao histórico..."
          className={inputCls}
        />
        <button
          type="submit"
          disabled={pending || !noteText.trim()}
          className="shrink-0 rounded-xl bg-brand px-4 text-sm font-extrabold text-white transition hover:brightness-105 disabled:opacity-50"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : "Anotar"}
        </button>
      </form>

      <ErrorBox message={error} />

      {events === null ? (
        <p className="py-6 text-center text-sm font-semibold text-muted">
          Carregando histórico...
        </p>
      ) : events.length === 0 ? (
        <p className="py-6 text-center text-sm font-semibold text-muted">
          Nenhum evento registrado.
        </p>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-line pl-4">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span
                className="absolute -left-[1.4375rem] top-1 size-3 rounded-full border-2 border-white"
                style={{
                  backgroundColor: EVENT_COLORS[event.type] ?? "#8a92b2",
                }}
              />
              <p className="text-sm font-bold leading-snug text-ink">
                {describeEvent(event, stageNameById)}
              </p>
              <p
                className="text-[11px] font-semibold text-muted"
                title={formatDateTime(event.createdAt)}
              >
                {formatDateTime(event.createdAt)} · {relativeTime(event.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function ApplicationModal({
  app,
  stages,
  onClose,
  onMove,
}: {
  app: AppCard | null;
  stages: StageDTO[];
  onClose: () => void;
  onMove: (app: AppCard, toStageId: string) => void;
}) {
  const [tab, setTab] = useState<
    "detalhes" | "descricao" | "swot" | "historico"
  >("detalhes");
  const stageNameById = useMemo(
    () => Object.fromEntries(stages.map((s) => [s.id, s.name])),
    [stages]
  );

  // Volta para a aba Detalhes ao trocar de vaga (ajuste durante o render)
  const [lastAppId, setLastAppId] = useState<string | null>(null);
  if (app && lastAppId !== app.id) {
    setLastAppId(app.id);
    setTab("detalhes");
  }

  if (!app) return null;

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={
        <span className="flex items-center gap-2">
          {app.company}
          {app.countryCode && (
            <Flag
              code={app.countryCode}
              className="h-3.5 w-[1.3125rem] rounded-[2px] shadow-sm"
            />
          )}
        </span>
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          {app.roleTitle}
          <PriorityPill priority={app.priority} />
        </span>
      }
    >
      <div className="mb-4 flex gap-1 rounded-xl bg-panel p-1">
        {(
          [
            ["detalhes", "Detalhes"],
            ["descricao", "Descrição"],
            ["swot", "SWOT"],
            ["historico", "Histórico"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-extrabold transition sm:text-sm ${
              tab === key
                ? "bg-white text-brand shadow-card"
                : "text-muted hover:text-ink-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "detalhes" && (
        <DetailsTab
          key={app.id}
          app={app}
          stages={stages}
          onClose={onClose}
          onMove={onMove}
        />
      )}
      {tab === "descricao" && <DescriptionTab key={app.id} app={app} />}
      {tab === "swot" && <SwotTab app={app} />}
      {tab === "historico" && (
        <HistoryTab app={app} stageNameById={stageNameById} />
      )}
    </Modal>
  );
}
