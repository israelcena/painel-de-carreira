"use client";

import {
  CircleAlert,
  Loader2,
  Plus,
  Shield,
  ShieldAlert,
  TrendingUp,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { addSwotItem, removeSwotItem } from "@/app/actions/swot";
import { SWOT_CONFIG, SWOT_ORDER } from "@/lib/domain";
import type { SwotItemDTO, SwotQuadrant } from "@/lib/types";

const QUADRANT_ICONS: Record<SwotQuadrant, typeof Shield> = {
  FORCA: Shield,
  FRAQUEZA: ShieldAlert,
  OPORTUNIDADE: TrendingUp,
  AMEACA: CircleAlert,
};

function Quadrant({
  quadrant,
  applicationId,
  items,
  onAdded,
  onRemoved,
  compact,
}: {
  quadrant: SwotQuadrant;
  applicationId: string | null;
  items: SwotItemDTO[];
  onAdded: (item: SwotItemDTO) => void;
  onRemoved: (id: string) => void;
  compact: boolean;
}) {
  const config = SWOT_CONFIG[quadrant];
  const Icon = QUADRANT_ICONS[quadrant];
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const add = () => {
    if (!text.trim() || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await addSwotItem({
        applicationId,
        quadrant,
        text,
      });
      if (result.ok && result.data) {
        onAdded(result.data);
        setText("");
      } else if (!result.ok) {
        setError(result.error);
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      const result = await removeSwotItem(id);
      if (result.ok) onRemoved(id);
      else setError(result.error);
    });
  };

  return (
    <section
      className="flex flex-col rounded-2xl bg-white p-3 shadow-card"
      style={{ borderTop: `4px solid ${config.color}` }}
    >
      <header className="mb-2 flex items-center gap-2">
        <span
          className="grid size-7 place-items-center rounded-lg"
          style={{ backgroundColor: `${config.color}1a`, color: config.color }}
        >
          <Icon size={15} strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold leading-tight text-ink">
            {config.label}
          </h3>
          {!compact && (
            <p className="text-[10px] font-bold text-muted">{config.hint}</p>
          )}
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-extrabold"
          style={{ backgroundColor: `${config.color}1a`, color: config.color }}
        >
          {items.length}
        </span>
      </header>

      <ul className={`flex-1 space-y-1.5 ${compact ? "" : "min-h-24"}`}>
        {items.length === 0 && (
          <li className="rounded-lg border-2 border-dashed border-line px-2.5 py-2 text-xs font-semibold text-muted">
            Nenhum item ainda.
          </li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-start gap-2 rounded-lg bg-panel px-2.5 py-1.5"
          >
            <span className="min-w-0 flex-1 whitespace-pre-wrap text-[13px] font-semibold leading-snug text-ink">
              {item.text}
            </span>
            <button
              type="button"
              onClick={() => remove(item.id)}
              disabled={pending}
              aria-label="Remover item"
              className="mt-0.5 shrink-0 rounded-md p-0.5 text-muted opacity-60 transition hover:bg-white hover:text-red-500 group-hover:opacity-100"
            >
              <X size={13} strokeWidth={2.6} />
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p className="mt-1.5 text-[11px] font-bold text-red-500">{error}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="mt-2 flex gap-1.5"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Adicionar item..."
          className="min-w-0 flex-1 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[13px] font-semibold text-ink outline-none transition placeholder:text-muted focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          aria-label={`Adicionar em ${config.label}`}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-white transition hover:brightness-105 disabled:opacity-40"
          style={{ backgroundColor: config.color }}
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={15} strokeWidth={2.8} />
          )}
        </button>
      </form>
    </section>
  );
}

/**
 * Grade SWOT 2×2 (1 coluna no mobile). Usada na página Planejamento
 * (applicationId=null) e na aba SWOT do modal da vaga.
 */
export function SwotGrid({
  applicationId,
  initialItems,
  compact = false,
}: {
  applicationId: string | null;
  initialItems: SwotItemDTO[];
  compact?: boolean;
}) {
  const [items, setItems] = useState<SwotItemDTO[]>(initialItems);

  // Ressincroniza quando os dados do servidor mudam (padrão ajuste-no-render)
  const [synced, setSynced] = useState(initialItems);
  if (synced !== initialItems) {
    setSynced(initialItems);
    setItems(initialItems);
  }

  return (
    <div
      className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "md:grid-cols-2 md:gap-4"}`}
    >
      {SWOT_ORDER.map((quadrant) => (
        <Quadrant
          key={quadrant}
          quadrant={quadrant}
          applicationId={applicationId}
          items={items.filter((item) => item.quadrant === quadrant)}
          onAdded={(item) => setItems((prev) => [...prev, item])}
          onRemoved={(id) =>
            setItems((prev) => prev.filter((item) => item.id !== id))
          }
          compact={compact}
        />
      ))}
    </div>
  );
}
