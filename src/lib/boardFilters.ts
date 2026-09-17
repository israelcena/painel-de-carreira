import { countryName } from "./countries";
import { BRAZIL_CODE } from "./domain";
import { endOfDayFromInput, startOfDayFromInput } from "./format";
import type { AppCard, Origin } from "./types";

/**
 * Filtro aplicado no cliente sobre os cards do quadro (geral ou por raia).
 * - `origin`: atalho Brasil × exterior das pills da toolbar (só no filtro geral).
 * - `countries`: códigos ISO selecionados no popover.
 * - `from`/`to`: datas no formato de <input type="date"> ("YYYY-MM-DD"),
 *   comparadas com a entrada do card na etapa atual (stageEnteredAt).
 */
export interface BoardFilter {
  origin: Origin | "";
  countries: string[];
  from: string;
  to: string;
}

export const EMPTY_FILTER: BoardFilter = {
  origin: "",
  countries: [],
  from: "",
  to: "",
};

export interface CountryOption {
  code: string;
  name: string;
  count: number;
}

/** Algum critério ativo, incluindo a origem das pills. */
export function isFilterActive(filter: BoardFilter): boolean {
  return filter.origin !== "" || isNarrowingFilterActive(filter);
}

/**
 * País ou data ativos — os critérios do popover. A origem fica de fora porque
 * as pills já exibem esse estado e ela não desativa o arraste.
 */
export function isNarrowingFilterActive(filter: BoardFilter): boolean {
  return filter.countries.length > 0 || filter.from !== "" || filter.to !== "";
}

/** Quantidade de critérios do popover ativos (país conta como 1, cada data como 1). */
export function activeFilterCount(filter: BoardFilter): number {
  return (
    (filter.countries.length > 0 ? 1 : 0) +
    (filter.from ? 1 : 0) +
    (filter.to ? 1 : 0)
  );
}

export function matchesOrigin(countryCode: string, origin: Origin | ""): boolean {
  if (origin === "") return true;
  const isBrazil = countryCode.toUpperCase() === BRAZIL_CODE;
  return origin === "BRASIL" ? isBrazil : !isBrazil;
}

export function matchesFilter(app: AppCard, filter: BoardFilter): boolean {
  if (!matchesOrigin(app.countryCode, filter.origin)) return false;
  if (filter.countries.length > 0) {
    const code = app.countryCode.toUpperCase();
    if (!filter.countries.includes(code)) return false;
  }
  if (filter.from || filter.to) {
    const entered = new Date(app.stageEnteredAt).getTime();
    if (filter.from && entered < startOfDayFromInput(filter.from).getTime())
      return false;
    if (filter.to && entered > endOfDayFromInput(filter.to).getTime())
      return false;
  }
  return true;
}

/** Países presentes nos cards informados, com contagem, ordenados pelo nome em pt. */
export function countryOptions(apps: AppCard[]): CountryOption[] {
  const counts = new Map<string, number>();
  for (const app of apps) {
    if (!app.countryCode) continue;
    const code = app.countryCode.toUpperCase();
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, name: countryName(code), count }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));
}
