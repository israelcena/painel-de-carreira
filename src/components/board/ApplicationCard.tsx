"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, ExternalLink, MessageSquareText, Send } from "lucide-react";
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

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) onOpen(app);
      }}
      className={`cursor-pointer touch-manipulation rounded-lg bg-white p-3 shadow-card transition-shadow hover:shadow-float ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <CardBody app={app} isRejectionColumn={isRejectionColumn} />
    </article>
  );
}
