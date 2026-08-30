"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarClock,
  Clock,
  ExternalLink,
  FileText,
  GripVertical,
  MessageSquareText,
  Send,
} from "lucide-react";
import { useRef } from "react";
import { REJECTION_REASON_LABELS } from "@/lib/domain";
import { daysSince, formatDate } from "@/lib/format";
import type { AppCard } from "@/lib/types";
import { Flag } from "@/components/ui/Flag";
import { PriorityPill } from "@/components/ui/PriorityPill";

export function CardBody({
  app,
  isRejectionColumn,
}: {
  app: AppCard;
  isRejectionColumn: boolean;
}) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <PriorityPill priority={app.priority} />
        {app.countryCode && (
          <Flag
            code={app.countryCode}
            className="h-3.5 w-[1.3125rem] rounded-[2px] shadow-sm"
          />
        )}
      </div>

      <h3 className="text-sm font-extrabold leading-snug text-ink">
        {app.company}
      </h3>
      <p className="text-xs font-semibold leading-snug text-ink-soft">
        {app.roleTitle}
      </p>

      {isRejectionColumn && app.rejectionReason && (
        <p className="mt-1.5 line-clamp-2 text-[11px] font-bold text-red-500">
          {REJECTION_REASON_LABELS[app.rejectionReason]}
        </p>
      )}

      {(app.nextActionNote || app.nextActionAt) && (
        <p
          className={`mt-1.5 flex items-center gap-1 truncate text-[11px] font-bold ${
            app.nextActionAt &&
            new Date(app.nextActionAt).setHours(0, 0, 0, 0) <
              new Date().setHours(0, 0, 0, 0)
              ? "text-red-500"
              : "text-ink-soft"
          }`}
          title="Próxima ação"
        >
          <CalendarClock size={11} strokeWidth={2.5} className="shrink-0" />
          <span className="truncate">
            {app.nextActionNote ?? "Próxima ação"}
          </span>
          {app.nextActionAt && (
            <span className="shrink-0">· {formatDate(app.nextActionAt)}</span>
          )}
        </p>
      )}

      <div className="mt-2.5 flex items-center gap-2.5 text-muted">
        {app.appliedAt && (
          <span
            title={`Aplicada em ${formatDate(app.appliedAt)}`}
            className="flex items-center gap-1 text-[11px] font-bold"
          >
            <Send size={11} strokeWidth={2.5} />
            {formatDate(app.appliedAt)}
          </span>
        )}
        {app.noteCount > 0 && (
          <span
            title={`${app.noteCount} nota(s)`}
            className="flex items-center gap-1 text-[11px] font-bold"
          >
            <MessageSquareText size={11} strokeWidth={2.5} />
            {app.noteCount}
          </span>
        )}
        {app.jobDescription && (
          <span title="Tem descrição da vaga" className="flex items-center">
            <FileText size={11} strokeWidth={2.5} />
          </span>
        )}
        <span
          title="Dias na etapa atual"
          className="flex items-center gap-1 text-[11px] font-bold"
        >
          <Clock size={11} strokeWidth={2.5} />
          {daysSince(app.stageEnteredAt)}d
        </span>
        {app.jobUrl && (
          <a
            href={app.jobUrl}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            title="Abrir vaga"
            className="ml-auto rounded-md p-1 transition hover:bg-panel hover:text-brand"
          >
            <ExternalLink size={13} strokeWidth={2.5} />
          </a>
        )}
      </div>
    </>
  );
}

export function ApplicationCard({
  app,
  isRejectionColumn,
  disabled,
  onOpen,
}: {
  app: AppCard;
  isRejectionColumn: boolean;
  disabled: boolean;
  onOpen: (app: AppCard) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id, disabled });

  // Guarda onde o dedo/mouse começou para distinguir toque de scroll/arraste
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (isDragging) return;
    if (!start) return;
    const moved =
      Math.abs(e.clientX - start.x) > 8 || Math.abs(e.clientY - start.y) > 8;
    if (!moved) onOpen(app);
  };

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      onPointerDown={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={handlePointerUp}
      className={`relative cursor-pointer touch-manipulation select-none rounded-lg bg-white p-3 pr-9 shadow-card transition-all duration-150 hover:shadow-float active:scale-[0.98] active:bg-panel ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <CardBody app={app} isRejectionColumn={isRejectionColumn} />
      <button
        type="button"
        {...listeners}
        aria-label="Arrastar card"
        onClick={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-grab touch-none select-none rounded-md p-1.5 text-muted transition hover:bg-panel hover:text-ink active:cursor-grabbing"
      >
        <GripVertical size={16} strokeWidth={2.5} />
      </button>
    </article>
  );
}
