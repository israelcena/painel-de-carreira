"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowDownWideNarrow, Loader2, Plus } from "lucide-react";
import type { BoardFilter, CountryOption } from "@/lib/boardFilters";
import type { AppCard, StageDTO } from "@/lib/types";
import { ApplicationCard } from "./ApplicationCard";
import { FilterPopover } from "./FilterPopover";

export function Column({
  stage,
  cards,
  total,
  filter,
  countries,
  dndDisabled,
  sortPending,
  sortActive,
  onFilterChange,
  onSortByRecency,
  onAdd,
  onOpen,
  onArchive,
}: {
  stage: StageDTO;
  /** Cards visíveis (já filtrados pela busca e pelos filtros geral/da raia). */
  cards: AppCard[];
  /** Total de cards da raia, sem filtros. */
  total: number;
  filter: BoardFilter;
  countries: CountryOption[];
  dndDisabled: boolean;
  /** Alguma ordenação em andamento no quadro (desabilita o botão). */
  sortPending: boolean;
  /** Esta raia é a que está sendo ordenada (mostra o spinner). */
  sortActive: boolean;
  onFilterChange: (next: BoardFilter) => void;
  onSortByRecency: () => void;
  onAdd: (stageId: string) => void;
  onOpen: (app: AppCard) => void;
  onArchive: (app: AppCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const hiddenByFilters = total > 0 && cards.length === 0;

  return (
    <section
      className="flex max-h-full w-[85vw] shrink-0 snap-center flex-col overflow-hidden rounded-xl bg-panel/85 shadow-card sm:w-[62vw] md:w-72 md:snap-align-none 2xl:w-auto 2xl:min-w-60 2xl:max-w-96 2xl:flex-1"
      style={{ borderTop: `4px solid ${stage.color}` }}
    >
      <header className="flex items-center justify-between gap-2 px-3 pb-2 pt-2.5">
        <h2 className="truncate text-sm font-extrabold text-ink">
          {stage.name}
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className="rounded-full bg-white px-2 py-0.5 text-xs font-extrabold"
            style={{ color: stage.color }}
            title={
              cards.length !== total
                ? `${cards.length} visíveis de ${total}`
                : undefined
            }
          >
            {cards.length}
            {cards.length !== total && (
              <span className="text-muted">/{total}</span>
            )}
          </span>
          <FilterPopover
            variant="icon"
            label={`Filtrar ${stage.name}`}
            value={filter}
            onChange={onFilterChange}
            countries={countries}
            extraActions={
              <button
                type="button"
                disabled={sortPending || total < 2}
                onClick={onSortByRecency}
                title="Reorganiza esta raia pela data de entrada na etapa (mais recente em cima)"
                className="ml-auto flex items-center gap-1 rounded-lg bg-panel px-2.5 py-1.5 text-xs font-extrabold text-ink-soft transition hover:bg-brand/10 hover:text-brand disabled:opacity-50"
              >
                {sortActive ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <ArrowDownWideNarrow size={12} strokeWidth={2.5} />
                )}
                Ordenar por mais recentes
              </button>
            }
          />
        </div>
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
              onArchive={onArchive}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="grid h-20 place-items-center rounded-lg border-2 border-dashed border-line px-3 text-center text-xs font-bold text-muted">
            {hiddenByFilters
              ? "Nenhuma vaga com a busca/filtros atuais"
              : "Arraste vagas para cá"}
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
