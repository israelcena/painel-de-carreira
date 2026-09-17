"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  Archive,
  ArrowDownWideNarrow,
  Globe,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  archiveApplication,
  moveApplication,
  rejectApplication,
  reorderBoardByRecency,
  reorderStageByRecency,
} from "@/app/actions/applications";
import {
  countryOptions,
  EMPTY_FILTER,
  isFilterActive,
  isNarrowingFilterActive,
  matchesFilter,
  type BoardFilter,
} from "@/lib/boardFilters";
import { BRAZIL_CODE, ORIGIN_LABELS } from "@/lib/domain";
import { dateFromInput, formatDate } from "@/lib/format";
import type { AppCard, Origin, StageDTO } from "@/lib/types";
import { useSearchQuery } from "@/lib/useSearchQuery";
import { ApplicationModal } from "@/components/modals/ApplicationModal";
import { NewApplicationModal } from "@/components/modals/NewApplicationModal";
import {
  RejectModal,
  type RejectPayload,
} from "@/components/modals/RejectModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Flag } from "@/components/ui/Flag";
import { CardBody } from "./ApplicationCard";
import { Column } from "./Column";
import { FilterPopover } from "./FilterPopover";

/** Chip que resume o filtro geral ativo na toolbar, com atalho para limpar. */
function FilterChips({
  filter,
  onClear,
}: {
  filter: BoardFilter;
  onClear: () => void;
}) {
  if (!isFilterActive(filter)) return null;
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/70 py-1 pl-2.5 pr-1 text-xs font-bold text-ink-soft shadow-card">
      {filter.origin && <span>{ORIGIN_LABELS[filter.origin]}</span>}
      {filter.countries.map((code) => (
        <Flag
          key={code}
          code={code}
          className="h-3 w-[1.125rem] rounded-[2px] shadow-sm"
        />
      ))}
      {(filter.from || filter.to) && (
        <span>
          {filter.from && `de ${formatDate(dateFromInput(filter.from))}`}
          {filter.from && filter.to && " "}
          {filter.to && `até ${formatDate(dateFromInput(filter.to))}`}
        </span>
      )}
      <button
        type="button"
        onClick={onClear}
        aria-label="Limpar filtros"
        className="rounded-full p-0.5 text-muted transition hover:bg-panel hover:text-ink"
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </span>
  );
}

type ColumnsState = Record<string, string[]>;
type AppsState = Record<string, AppCard>;
type Snapshot = { columns: ColumnsState; appsById: AppsState };

function buildState(stages: StageDTO[], apps: AppCard[]) {
  const byId: AppsState = {};
  const cols: ColumnsState = {};
  for (const stage of stages) cols[stage.id] = [];
  for (const app of apps) {
    byId[app.id] = app;
    (cols[app.stageId] ??= []).push(app.id);
  }
  for (const stageId of Object.keys(cols)) {
    cols[stageId].sort((a, b) => byId[a].position - byId[b].position);
  }
  return { byId, cols };
}

/** Pills Tudo / Brasil / Exterior — atalho do filtro geral (origem), no lugar das antigas abas. */
function OriginTabs({
  value,
  onChange,
}: {
  value: Origin | "";
  onChange: (origin: Origin | "") => void;
}) {
  const options: { value: Origin | ""; label: string; icon?: ReactNode }[] = [
    { value: "", label: "Tudo" },
    {
      value: "BRASIL",
      label: ORIGIN_LABELS.BRASIL,
      icon: (
        <Flag code={BRAZIL_CODE} className="h-3 w-[1.125rem] rounded-[2px]" />
      ),
    },
    {
      value: "EXTERIOR",
      label: ORIGIN_LABELS.EXTERIOR,
      icon: <Globe size={14} strokeWidth={2.5} />,
    },
  ];
  return (
    <nav
      aria-label="Origem das vagas"
      className="flex rounded-full bg-white/70 p-1 shadow-card"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition md:px-4 md:text-sm ${
              active
                ? "bg-gradient-to-r from-brand-violet to-brand-blue text-white shadow-card"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </nav>
  );
}

export function Board({
  stages,
  apps,
}: {
  stages: StageDTO[];
  apps: AppCard[];
}) {
  // id estável evita divergência SSR/cliente no aria-describedby gerado pelo dnd-kit
  const dndId = useId();
  const router = useRouter();
  const stagesById = useMemo(
    () => Object.fromEntries(stages.map((s) => [s.id, s])),
    [stages]
  );
  const rejectionStage = useMemo(
    () => stages.find((s) => s.isRejection),
    [stages]
  );

  const [appsById, setAppsById] = useState<AppsState>(
    () => buildState(stages, apps).byId
  );
  const [columns, setColumns] = useState<ColumnsState>(
    () => buildState(stages, apps).cols
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AppCard | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [rejectPending, startRejectTransition] = useTransition();
  const [editing, setEditing] = useState<AppCard | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStageId, setCreateStageId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AppCard | null>(null);
  const [globalFilter, setGlobalFilter] = useState<BoardFilter>(EMPTY_FILTER);
  const [laneFilters, setLaneFilters] = useState<Record<string, BoardFilter>>(
    {}
  );
  // Raia sendo reordenada ("*" = quadro inteiro) enquanto a action roda
  const [sortingStageId, setSortingStageId] = useState<string | null>(null);
  const [sortPending, startSortTransition] = useTransition();
  const snapshotRef = useRef<Snapshot | null>(null);
  // Ids arquivados otimisticamente cuja action ainda não respondeu
  const [pendingRemovals, setPendingRemovals] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const markPendingRemoval = (id: string, pending: boolean) =>
    setPendingRemovals((prev) => {
      if (prev.has(id) === pending) return prev;
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });

  // Sincroniza com os dados do servidor (após revalidação das actions).
  // Padrão "ajustar estado durante o render" — evita renders em cascata.
  const [syncedApps, setSyncedApps] = useState(apps);
  if (syncedApps !== apps) {
    setSyncedApps(apps);
    // As server actions são processadas em fila (FIFO): o payload de uma action
    // anterior e lenta pode chegar antes do arquivar terminar e ainda conter o
    // card. Ele fica fora do quadro até a própria action responder.
    const fresh = apps.filter((a) => !pendingRemovals.has(a.id));
    const { byId, cols } = buildState(stages, fresh);
    setAppsById(byId);
    setColumns(cols);
    // Mantém os modais apontando para os dados frescos
    if (editing) setEditing(apps.find((a) => a.id === editing.id) ?? null);
    if (archiveTarget) {
      setArchiveTarget(fresh.find((a) => a.id === archiveTarget.id) ?? null);
    }
  }

  // Dados novos do servidor substituem o estado que o snapshot descrevia
  useEffect(() => {
    snapshotRef.current = null;
  }, [apps]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const q = useSearchQuery().trim().toLowerCase();
  // Busca, país ou data escondem vizinhos e desativam o arraste. A origem
  // (pills Brasil/Exterior) não desativa: antes cada aba era um quadro arrastável,
  // e `columns` guarda a ordem completa, então a posição calculada entre os
  // vizinhos reais preserva a ordem visual dentro da visão filtrada.
  // Um filtro de raia desativa o arraste só dentro daquela raia.
  const globalNarrowing = q.length > 0 || isNarrowingFilterActive(globalFilter);
  const laneNarrowing = (stageId: string) =>
    isNarrowingFilterActive(laneFilters[stageId] ?? EMPTY_FILTER);
  const anyDndDisabled =
    globalNarrowing || Object.values(laneFilters).some(isNarrowingFilterActive);

  // Cards visíveis por raia: busca da topbar + filtro geral + filtro da raia
  const visibleByStage = useMemo(() => {
    const matchesSearch = (app: AppCard) =>
      !q ||
      app.company.toLowerCase().includes(q) ||
      app.roleTitle.toLowerCase().includes(q) ||
      (app.platform ?? "").toLowerCase().includes(q);

    const out: Record<string, AppCard[]> = {};
    for (const stage of stages) {
      const lane = laneFilters[stage.id] ?? EMPTY_FILTER;
      out[stage.id] = (columns[stage.id] ?? [])
        .map((id) => appsById[id])
        .filter(Boolean)
        .filter(
          (app) =>
            matchesSearch(app) &&
            matchesFilter(app, globalFilter) &&
            matchesFilter(app, lane)
        );
    }
    return out;
  }, [stages, columns, appsById, q, globalFilter, laneFilters]);

  // Opções de país: do quadro inteiro (filtro geral) e de cada raia (filtro da raia)
  const allCountries = useMemo(
    () => countryOptions(Object.values(appsById)),
    [appsById]
  );
  const countriesByStage = useMemo(() => {
    const out: Record<string, ReturnType<typeof countryOptions>> = {};
    for (const stage of stages) {
      out[stage.id] = countryOptions(
        (columns[stage.id] ?? []).map((id) => appsById[id]).filter(Boolean)
      );
    }
    return out;
  }, [stages, columns, appsById]);

  const setLaneFilter = (stageId: string, next: BoardFilter) =>
    setLaneFilters((prev) => {
      if (!isFilterActive(next)) {
        if (!(stageId in prev)) return prev;
        const rest = { ...prev };
        delete rest[stageId];
        return rest;
      }
      return { ...prev, [stageId]: next };
    });

  const sortStage = (stageId: string) => {
    setSortingStageId(stageId);
    startSortTransition(async () => {
      const result = await reorderStageByRecency({ stageId });
      if (!result.ok) setToast(result.error);
      setSortingStageId(null);
    });
  };

  const sortBoard = () => {
    setSortingStageId("*");
    startSortTransition(async () => {
      const result = await reorderBoardByRecency();
      if (!result.ok) setToast(result.error);
      else setToast("Raias ordenadas por mais recentes");
      setSortingStageId(null);
    });
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 8 },
    })
  );

  const findColumn = (id: string): string | undefined => {
    if (columns[id]) return id;
    return Object.keys(columns).find((colId) => columns[colId].includes(id));
  };

  const takeSnapshot = (): Snapshot => {
    const snap: Snapshot = {
      columns: structuredClone(columns),
      appsById: { ...appsById },
    };
    snapshotRef.current = snap;
    return snap;
  };

  // Com `snap`, restaura só se ele ainda for o snapshot corrente: uma mutação
  // posterior (ou um resync do servidor) já substituiu o estado que ele descrevia,
  // e restaurá-lo ressuscitaria/apagaria cards de outras operações.
  const restoreSnapshot = (snap?: Snapshot | null) => {
    const current = snapshotRef.current;
    if (!current) return;
    if (snap && snap !== current) return;
    setColumns(current.columns);
    setAppsById(current.appsById);
  };

  // Falha de action assíncrona: desfaz o que ainda for possível, avisa e busca o
  // estado real do servidor (as actions só revalidam em caso de sucesso).
  const rollback = (snap: Snapshot | null, message: string) => {
    restoreSnapshot(snap);
    setToast(message);
    router.refresh();
  };

  const originColumnOf = (appId: string): string | undefined => {
    const snap = snapshotRef.current;
    if (!snap) return appsById[appId]?.stageId;
    return Object.keys(snap.columns).find((colId) =>
      snap.columns[colId].includes(appId)
    );
  };

  const computePosition = (
    orderedIds: string[],
    index: number,
    byId: AppsState
  ): number => {
    const prevId = index > 0 ? orderedIds[index - 1] : undefined;
    const nextId =
      index < orderedIds.length - 1 ? orderedIds[index + 1] : undefined;
    const prevPos = prevId ? byId[prevId]?.position : undefined;
    const nextPos = nextId ? byId[nextId]?.position : undefined;
    if (prevPos === undefined && nextPos === undefined) return 1024;
    if (prevPos === undefined) return (nextPos as number) - 1;
    if (nextPos === undefined) return prevPos + 1024;
    return (prevPos + nextPos) / 2;
  };

  const commitMove = (appId: string, toStageId: string, position: number) => {
    const snap = snapshotRef.current;
    setAppsById((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        stageId: toStageId,
        position,
        stageEnteredAt:
          prev[appId].stageId === toStageId
            ? prev[appId].stageEnteredAt
            : new Date(),
      },
    }));
    void moveApplication({ id: appId, toStageId, position })
      .then((result) => {
        if (!result.ok) rollback(snap, result.error);
      })
      .catch(() => rollback(snap, "Erro ao mover a vaga."));
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    takeSnapshot();
    document.body.classList.add("dragging-active");
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeCol = findColumn(String(active.id));
    const overCol = findColumn(String(over.id));
    if (!activeCol || !overCol || activeCol === overCol) return;

    setColumns((prev) => {
      const activeIds = prev[activeCol].filter((id) => id !== active.id);
      const overIds = [...prev[overCol]];
      const overIndex = overIds.indexOf(String(over.id));
      const insertAt = overIndex >= 0 ? overIndex : overIds.length;
      overIds.splice(insertAt, 0, String(active.id));
      return { ...prev, [activeCol]: activeIds, [overCol]: overIds };
    });
  };

  const finishDrag = () => {
    setActiveId(null);
    document.body.classList.remove("dragging-active");
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    finishDrag();
    const appId = String(active.id);
    const app = appsById[appId];
    if (!app || !over) {
      restoreSnapshot();
      return;
    }

    const overCol = findColumn(String(over.id));
    const originCol = originColumnOf(appId);
    if (!overCol || !originCol) {
      restoreSnapshot();
      return;
    }

    // Reordenação final dentro da coluna quando soltou sobre outro card
    let finalCols = columns;
    const overId = String(over.id);
    if (
      overId !== appId &&
      columns[overCol]?.includes(overId) &&
      findColumn(appId) === overCol
    ) {
      const oldIndex = columns[overCol].indexOf(appId);
      const newIndex = columns[overCol].indexOf(overId);
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        finalCols = {
          ...columns,
          [overCol]: arrayMove(columns[overCol], oldIndex, newIndex),
        };
        setColumns(finalCols);
      }
    }

    const index = finalCols[overCol].indexOf(appId);
    if (index < 0) {
      restoreSnapshot();
      return;
    }

    const toStage = stagesById[overCol];
    const originStage = stagesById[originCol];

    // Soltou na coluna Rejeitado vindo de outra etapa → pede o motivo
    if (toStage.isRejection && !originStage.isRejection) {
      setRejectError(null);
      setRejectTarget(app);
      return;
    }

    const position = computePosition(finalCols[overCol], index, appsById);
    if (overCol === originCol && position === app.position) return;
    commitMove(appId, overCol, position);
  };

  const onDragCancel = () => {
    finishDrag();
    restoreSnapshot();
  };

  const confirmReject = (payload: RejectPayload) => {
    if (!rejectTarget || !rejectionStage) return;
    const appId = rejectTarget.id;
    startRejectTransition(async () => {
      const result = await rejectApplication({
        id: appId,
        reason: payload.reason,
        note: payload.note || null,
        rejectedAt: payload.rejectedAt || null,
      });
      if (result.ok) {
        setAppsById((prev) => ({
          ...prev,
          [appId]: {
            ...prev[appId],
            stageId: rejectionStage.id,
            rejectionReason: payload.reason,
            stageEnteredAt: new Date(),
          },
        }));
        setRejectTarget(null);
      } else {
        setRejectError(result.error);
      }
    });
  };

  const cancelReject = () => {
    restoreSnapshot();
    setRejectTarget(null);
  };

  // Movimentação vinda do modal de detalhes (select "Mover para etapa").
  // O card entra no topo da raia de destino (mais recente em cima).
  const handleModalMove = (app: AppCard, toStageId: string) => {
    const toStage = stagesById[toStageId];
    if (!toStage || toStageId === app.stageId) return;

    takeSnapshot();
    setColumns((prev) => {
      const next: ColumnsState = { ...prev };
      next[app.stageId] = (next[app.stageId] ?? []).filter(
        (id) => id !== app.id
      );
      next[toStageId] = [
        app.id,
        ...(next[toStageId] ?? []).filter((id) => id !== app.id),
      ];
      return next;
    });
    setEditing(null);

    if (toStage.isRejection) {
      setRejectError(null);
      setRejectTarget(app);
      return;
    }

    const firstId = (columns[toStageId] ?? [])[0];
    const position = firstId
      ? (appsById[firstId]?.position ?? 2048) - 1024
      : 1024;
    commitMove(app.id, toStageId, position);
  };

  // Arquivar rápido pelo ícone do card: remove otimista e reverte se a action falhar
  const confirmArchive = () => {
    if (!archiveTarget) return;
    const app = archiveTarget;
    const snap = takeSnapshot();
    markPendingRemoval(app.id, true);
    setColumns((prev) => ({
      ...prev,
      [app.stageId]: (prev[app.stageId] ?? []).filter((id) => id !== app.id),
    }));
    setAppsById((prev) => {
      const next = { ...prev };
      delete next[app.id];
      return next;
    });
    setArchiveTarget(null);
    setToast("Vaga arquivada");
    void archiveApplication(app.id)
      .then((result) => {
        markPendingRemoval(app.id, false);
        if (!result.ok) rollback(snap, result.error);
      })
      .catch(() => {
        markPendingRemoval(app.id, false);
        rollback(snap, "Erro ao arquivar a vaga.");
      });
  };

  const activeApp = activeId ? appsById[activeId] : null;
  const totalCount = Object.keys(appsById).length;
  const visibleCount = Object.values(visibleByStage).reduce(
    (sum, cards) => sum + cards.length,
    0
  );

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col md:h-[calc(100dvh-3rem)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 pb-2 pt-3 md:px-6 md:pb-3 md:pt-5">
        <h1 className="text-lg font-extrabold tracking-tight text-ink md:text-xl">
          Candidaturas
        </h1>
        <OriginTabs
          value={globalFilter.origin}
          onChange={(origin) =>
            setGlobalFilter((prev) => ({ ...prev, origin }))
          }
        />
        <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-extrabold text-ink-soft">
          {visibleCount !== totalCount
            ? `${visibleCount} de ${totalCount} vagas`
            : `${totalCount} ${totalCount === 1 ? "vaga" : "vagas"}`}
        </span>
        <FilterPopover
          label="Filtros do quadro"
          value={globalFilter}
          onChange={setGlobalFilter}
          countries={allCountries}
          extraActions={
            <button
              type="button"
              disabled={sortPending || totalCount < 2}
              onClick={sortBoard}
              title="Reorganiza todas as raias pela data de entrada na etapa (mais recente em cima)"
              className="ml-auto flex items-center gap-1 rounded-lg bg-panel px-2.5 py-1.5 text-xs font-extrabold text-ink-soft transition hover:bg-brand/10 hover:text-brand disabled:opacity-50"
            >
              {sortPending && sortingStageId === "*" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ArrowDownWideNarrow size={12} strokeWidth={2.5} />
              )}
              Ordenar tudo por mais recentes
            </button>
          }
        />
        <FilterChips
          filter={globalFilter}
          onClear={() => setGlobalFilter(EMPTY_FILTER)}
        />
        {anyDndDisabled && (
          <span className="text-xs font-bold text-ink-soft">
            Arraste desativado durante busca/filtro
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            setCreateStageId(null);
            setCreateOpen(true);
          }}
          className="ml-auto hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-violet to-brand-blue px-4 py-2 text-sm font-extrabold text-white shadow-card transition hover:brightness-105 md:flex"
        >
          <Plus size={16} strokeWidth={2.6} /> Nova vaga
        </button>
      </div>

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="nice-scroll flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-3 pb-3 md:snap-none md:gap-4 md:px-6 md:pb-4 2xl:gap-5">
          {stages.map((stage) => (
            <Column
              key={stage.id}
              stage={stage}
              cards={visibleByStage[stage.id] ?? []}
              total={(columns[stage.id] ?? []).length}
              filter={laneFilters[stage.id] ?? EMPTY_FILTER}
              countries={countriesByStage[stage.id] ?? []}
              dndDisabled={globalNarrowing || laneNarrowing(stage.id)}
              sortPending={sortPending}
              sortActive={sortPending && sortingStageId === stage.id}
              onFilterChange={(next) => setLaneFilter(stage.id, next)}
              onSortByRecency={() => sortStage(stage.id)}
              onAdd={(stageId) => {
                setCreateStageId(stageId);
                setCreateOpen(true);
              }}
              onOpen={setEditing}
              onArchive={setArchiveTarget}
            />
          ))}
        </div>

        <DragOverlay>
          {activeApp && (
            <div className="w-64 rotate-2 rounded-lg bg-white p-3 opacity-95 shadow-float">
              <CardBody app={activeApp} isRejectionColumn={false} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <button
        type="button"
        onClick={() => {
          setCreateStageId(null);
          setCreateOpen(true);
        }}
        aria-label="Nova vaga"
        className="fixed bottom-20 right-4 z-40 grid size-13 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-blue text-white shadow-float transition hover:brightness-105 active:scale-95 md:bottom-6 md:right-6"
      >
        <Plus size={24} strokeWidth={2.6} />
      </button>

      <NewApplicationModal
        open={createOpen}
        defaultCountryCode={
          globalFilter.origin === "EXTERIOR" ? "" : BRAZIL_CODE
        }
        stages={stages}
        defaultStageId={createStageId}
        onClose={() => setCreateOpen(false)}
      />

      <ApplicationModal
        app={editing}
        stages={stages}
        onClose={() => setEditing(null)}
        onMove={handleModalMove}
      />

      <RejectModal
        key={rejectTarget?.id ?? "none"}
        open={rejectTarget !== null}
        appLabel={
          rejectTarget
            ? `${rejectTarget.company} — ${rejectTarget.roleTitle}`
            : ""
        }
        pending={rejectPending}
        error={rejectError}
        onConfirm={confirmReject}
        onCancel={cancelReject}
      />

      <ConfirmDialog
        open={archiveTarget !== null}
        title="Arquivar vaga"
        subtitle={
          archiveTarget
            ? `${archiveTarget.company} — ${archiveTarget.roleTitle}`
            : undefined
        }
        description={
          <>
            A vaga sai do quadro, mas continua no{" "}
            <strong className="font-extrabold text-ink">Histórico</strong> e nas
            métricas. Dá para desarquivar depois.
          </>
        }
        icon={<Archive size={20} strokeWidth={2.5} />}
        confirmLabel="Arquivar"
        confirmIcon={<Archive size={15} strokeWidth={2.5} />}
        onConfirm={confirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-float md:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}
