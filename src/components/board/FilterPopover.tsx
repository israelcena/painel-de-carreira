"use client";

import { SlidersHorizontal, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  activeFilterCount,
  type BoardFilter,
  type CountryOption,
} from "@/lib/boardFilters";
import { countryName } from "@/lib/countries";
import { Field, inputCls } from "@/components/ui/fields";
import { Flag } from "@/components/ui/Flag";

const PANEL_WIDTH = 288; // w-72
const MARGIN = 8;
const GAP = 6;
/** Abaixo disso, o painel prefere abrir para cima (se houver mais espaço lá). */
const MIN_PANEL_HEIGHT = 240;

interface PanelStyle {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

const samePanelStyle = (a: PanelStyle | null, b: PanelStyle) =>
  a !== null &&
  a.top === b.top &&
  a.bottom === b.bottom &&
  a.left === b.left &&
  a.width === b.width &&
  a.maxHeight === b.maxHeight;

/**
 * Filtro de país (multi) + intervalo de entrada na etapa, em um popover.
 * O painel é renderizado em portal com position: fixed porque a coluna do
 * quadro tem overflow-hidden e cortaria um popover absoluto.
 */
export function FilterPopover({
  value,
  onChange,
  countries,
  label,
  variant = "pill",
  extraActions,
}: {
  value: BoardFilter;
  onChange: (next: BoardFilter) => void;
  countries: CountryOption[];
  label: string;
  /** "pill": botão com texto (toolbar). "icon": só o ícone (cabeçalho da raia). */
  variant?: "pill" | "icon";
  extraActions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<PanelStyle | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const ids = useId();
  const count = activeFilterCount(value);
  const active = count > 0;

  // Países selecionados que já não têm card no quadro continuam listados
  // (com contagem 0) para poderem ser desmarcados.
  const rows = useMemo(() => {
    const known = new Set(countries.map((country) => country.code));
    const stale = value.countries
      .filter((code) => !known.has(code))
      .map((code) => ({ code, name: countryName(code), count: 0 }));
    return [...countries, ...stale];
  }, [countries, value.countries]);

  // Posiciona o painel junto ao gatilho, alinhado à direita, dentro da viewport
  // e limitado à altura disponível (abre para cima quando não cabe embaixo).
  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { innerWidth, innerHeight } = window;
    // Gatilho saiu da tela (rolagem horizontal das raias): fecha em vez de
    // deixar o painel flutuando sobre outra coluna
    if (
      rect.right < 0 ||
      rect.left > innerWidth ||
      rect.bottom < 0 ||
      rect.top > innerHeight
    ) {
      setOpen(false);
      return;
    }
    const width = Math.min(PANEL_WIDTH, innerWidth - MARGIN * 2);
    const left = Math.min(
      Math.max(rect.right - width, MARGIN),
      innerWidth - width - MARGIN
    );
    const spaceBelow = innerHeight - rect.bottom - GAP - MARGIN;
    const spaceAbove = rect.top - GAP - MARGIN;
    const openAbove = spaceBelow < MIN_PANEL_HEIGHT && spaceAbove > spaceBelow;
    const next: PanelStyle = openAbove
      ? {
          bottom: innerHeight - rect.top + GAP,
          left,
          width,
          maxHeight: Math.max(spaceAbove, 120),
        }
      : {
          top: rect.bottom + GAP,
          left,
          width,
          maxHeight: Math.max(spaceBelow, 120),
        };
    // Mantém a referência quando nada mudou: evita re-render a cada scroll
    setPanelStyle((prev) => (samePanelStyle(prev, next) ? prev : next));
  }, []);

  const openPanel = () => {
    place();
    setOpen(true);
  };

  // Reposiciona após cada render enquanto aberto: marcar um filtro altera a
  // toolbar (pill "X de Y", chips) e pode mover o gatilho sem scroll/resize.
  useEffect(() => {
    if (open) place();
  });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // Redimensionar a janela ou rolar o quadro move o gatilho → reposiciona
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    document.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      document.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  const toggleCountry = (code: string) => {
    const has = value.countries.includes(code);
    onChange({
      ...value,
      countries: has
        ? value.countries.filter((c) => c !== code)
        : [...value.countries, code],
    });
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={label}
        className={
          variant === "pill"
            ? `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold shadow-card transition ${
                active
                  ? "bg-white text-brand"
                  : "bg-white/70 text-ink-soft hover:bg-white hover:text-ink"
              }`
            : `relative rounded-md p-1 transition ${
                active
                  ? "bg-white text-brand"
                  : "text-muted hover:bg-white hover:text-ink"
              }`
        }
      >
        <SlidersHorizontal
          size={variant === "pill" ? 14 : 13}
          strokeWidth={2.5}
        />
        {variant === "pill" && <span>Filtros</span>}
        {variant === "pill" && active && (
          <span className="grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold leading-4 text-white">
            {count}
          </span>
        )}
        {variant === "icon" && active && (
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-brand ring-2 ring-white" />
        )}
      </button>

      {open &&
        panelStyle &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={label}
            style={panelStyle}
            className="nice-scroll fixed z-50 overflow-y-auto rounded-xl bg-white p-3 shadow-float"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-ink">{label}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar filtros"
                className="rounded-full p-1 text-muted transition hover:bg-panel hover:text-ink"
              >
                <X size={14} />
              </button>
            </div>

            {rows.length > 0 && (
              <fieldset className="mb-3">
                <legend className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">
                  País
                </legend>
                <ul className="nice-scroll max-h-44 space-y-0.5 overflow-y-auto">
                  {rows.map((country) => {
                    const checked = value.countries.includes(country.code);
                    return (
                      <li key={country.code}>
                        <label
                          className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold transition hover:bg-panel ${
                            checked ? "text-ink" : "text-ink-soft"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCountry(country.code)}
                            className="size-3.5 accent-brand"
                          />
                          <Flag
                            code={country.code}
                            className="h-3 w-[1.125rem] rounded-[2px] shadow-sm"
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {country.name}
                          </span>
                          <span className="text-[11px] font-bold text-muted">
                            {country.count}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            )}

            <fieldset>
              <legend className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">
                Entrou na etapa
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <Field label="De" htmlFor={`${ids}-from`}>
                  <input
                    id={`${ids}-from`}
                    type="date"
                    value={value.from}
                    max={value.to || undefined}
                    onChange={(e) => onChange({ ...value, from: e.target.value })}
                    className={`${inputCls} px-2 py-1.5 text-xs`}
                  />
                </Field>
                <Field label="Até" htmlFor={`${ids}-to`}>
                  <input
                    id={`${ids}-to`}
                    type="date"
                    value={value.to}
                    min={value.from || undefined}
                    onChange={(e) => onChange({ ...value, to: e.target.value })}
                    className={`${inputCls} px-2 py-1.5 text-xs`}
                  />
                </Field>
              </div>
            </fieldset>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <button
                type="button"
                disabled={!active}
                // Limpa só o que este painel controla; a origem (pills) fica como está
                onClick={() =>
                  onChange({ ...value, countries: [], from: "", to: "" })
                }
                className="rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-ink-soft transition hover:bg-panel disabled:opacity-50"
              >
                Limpar filtros
              </button>
              {extraActions}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
