"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { AppCard, StageDTO } from "@/lib/types";
import { ApplicationCard } from "./ApplicationCard";

export function Column({
  stage,
  cards,
  dndDisabled,
  onAdd,
  onOpen,
}: {
  stage: StageDTO;
  cards: AppCard[];
  dndDisabled: boolean;
  onAdd: (stageId: string) => void;
  onOpen: (app: AppCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <section
      className="flex max-h-full w-[85vw] shrink-0 snap-center flex-col overflow-hidden rounded-xl bg-panel/85 shadow-card sm:w-[62vw] md:w-72 md:snap-align-none 2xl:w-auto 2xl:min-w-60 2xl:max-w-96 2xl:flex-1"
      style={{ borderTop: `4px solid ${stage.color}` }}
    >
      <header className="flex items-center justify-between gap-2 px-3 pb-2 pt-2.5">
        <h2 className="truncate text-sm font-extrabold text-ink">
          {stage.name}
        </h2>
        <span
          className="rounded-full bg-white px-2 py-0.5 text-xs font-extrabold"
          style={{ color: stage.color }}
        >
          {cards.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={`nice-scroll min-h-20 flex-1 space-y-2.5 overflow-y-auto px-2.5 pb-2 transition-colors ${
          isOver ? "bg-brand/5" : ""
        }`}
      >
        <SortableContext
          items={cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <ApplicationCard
              key={card.id}
              app={card}
              isRejectionColumn={stage.isRejection}
              disabled={dndDisabled}
              onOpen={onOpen}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="grid h-20 place-items-center rounded-lg border-2 border-dashed border-line text-xs font-bold text-muted">
            Arraste vagas para cá
          </div>
        )}
      </div>

      {!stage.isRejection && (
        <footer className="px-2.5 pb-2.5">
          <button
            type="button"
            onClick={() => onAdd(stage.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-extrabold text-muted transition hover:bg-white hover:text-brand"
          >
            Adicionar vaga <Plus size={14} strokeWidth={2.6} />
          </button>
        </footer>
      )}
    </section>
  );
}
