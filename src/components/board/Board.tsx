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
import { Globe, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  moveApplication,
  rejectApplication,
} from "@/app/actions/applications";
import { SECTION_LABELS, SLUG_BY_SECTION } from "@/lib/domain";
import type { AppCard, Section, StageDTO } from "@/lib/types";
import { useSearchQuery } from "@/lib/useSearchQuery";
import { ApplicationModal } from "@/components/modals/ApplicationModal";
import { NewApplicationModal } from "@/components/modals/NewApplicationModal";
import {
  RejectModal,
  type RejectPayload,
} from "@/components/modals/RejectModal";
import { Flag } from "@/components/ui/Flag";
import { CardBody } from "./ApplicationCard";
import { Column } from "./Column";

type ColumnsState = Record<string, string[]>;
type AppsState = Record<string, AppCard>;

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

function SectionTabs({ current }: { current: Section }) {
  return (
    <nav className="flex rounded-full bg-white/70 p-1 shadow-card">
      {(Object.keys(SECTION_LABELS) as Section[]).map((section) => {
        const active = section === current;
        return (
          <Link
            key={section}
            href={`/board/${SLUG_BY_SECTION[section]}`}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition md:px-4 md:text-sm ${
              active
                ? "bg-gradient-to-r from-brand-violet to-brand-blue text-white shadow-card"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {section === "NACIONAL" ? (
              <Flag code="BR" className="h-3 w-[1.125rem] rounded-[2px]" />
            ) : (
              <Globe size={14} strokeWidth={2.5} />
            )}
            {SECTION_LABELS[section]}
          </Link>
        );
      })}
    </nav>
  );
}

export function Board({
  section,
  stages,
  apps,
}: {
  section: Section;
  stages: StageDTO[];
  apps: AppCard[];
}) {
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
  const snapshotRef = useRef<{ columns: ColumnsState; appsById: AppsState } | null>(null);

  // Sincroniza com os dados do servidor (após revalidação das actions).
  // Padrão "ajustar estado durante o render" — evita renders em cascata.
  const [syncedApps, setSyncedApps] = useState(apps);
  if (syncedApps !== apps) {
    setSyncedApps(apps);
    const { byId, cols } = buildState(stages, apps);
    setAppsById(byId);
    setColumns(cols);
    // Mantém o modal de edição apontando para os dados frescos
    if (editing) setEditing(apps.find((a) => a.id === editing.id) ?? null);
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const q = useSearchQuery().trim().toLowerCase();
  const dndDisabled = q.length > 0;

  const matches = (app: AppCard) =>
    !q ||
    app.company.toLowerCase().includes(q) ||
    app.roleTitle.toLowerCase().includes(q) ||
    (app.platform ?? "").toLowerCase().includes(q);

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

  const takeSnapshot = () => {
    snapshotRef.current = {
      columns: structuredClone(columns),
      appsById: { ...appsById },
    };
  };

  const restoreSnapshot = () => {
    if (!snapshotRef.current) return;
    setColumns(snapshotRef.current.columns);
    setAppsById(snapshotRef.current.appsById);
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
    void moveApplication({ id: appId, toStageId, position }).then((result) => {
      if (!result.ok) {
        restoreSnapshot();
        setToast(result.error);
      }
    });
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

  // Movimentação vinda do modal de detalhes (select "Mover para etapa")
  const handleModalMove = (app: AppCard, toStageId: string) => {
    const toStage = stagesById[toStageId];
    if (!toStage || toStageId === app.stageId) return;

    takeSnapshot();
    setColumns((prev) => {
      const next: ColumnsState = { ...prev };
      next[app.stageId] = (next[app.stageId] ?? []).filter(
        (id) => id !== app.id
      );
      next[toStageId] = [...(next[toStageId] ?? []), app.id];
      return next;
    });
    setEditing(null);

    if (toStage.isRejection) {
      setRejectError(null);
      setRejectTarget(app);
      return;
    }

    const ids = columns[toStageId] ?? [];
    const lastId = ids[ids.length - 1];
    const position = lastId ? (appsById[lastId]?.position ?? 0) + 1024 : 1024;
    commitMove(app.id, toStageId, position);
  };

  const activeApp = activeId ? appsById[activeId] : null;
  const totalCount = apps.length;

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col md:h-[calc(100dvh-3rem)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 pb-2 pt-3 md:px-6 md:pb-3 md:pt-5">
        <h1 className="text-lg font-extrabold tracking-tight text-ink md:text-xl">
          Candidaturas
        </h1>
        <SectionTabs current={section} />
        <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-extrabold text-ink-soft">
          {totalCount} {totalCount === 1 ? "vaga" : "vagas"}
        </span>
        {dndDisabled && (
          <span className="text-xs font-bold text-ink-soft">
            Arraste desativado durante a busca
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
              cards={(columns[stage.id] ?? [])
                .map((id) => appsById[id])
                .filter(Boolean)
                .filter(matches)}
              dndDisabled={dndDisabled}
              onAdd={(stageId) => {
                setCreateStageId(stageId);
                setCreateOpen(true);
              }}
              onOpen={setEditing}
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
        section={section}
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

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-float md:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}
