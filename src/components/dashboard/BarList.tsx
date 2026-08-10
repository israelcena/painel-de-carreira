interface BarListItem {
  key: string;
  label: string;
  value: number;
  color: string;
  /** Sufixo do valor (ex.: "d" para dias) */
  suffix?: string;
}

/**
 * Lista de barras horizontais em HTML puro — ideal para rótulos longos
 * (motivos de rejeição, etapas). Todos os valores são rotulados de forma
 * visível (regra de alívio de contraste da paleta).
 */
export function BarList({ items }: { items: BarListItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm font-semibold text-muted">
        Sem dados ainda.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span
              className="truncate text-xs font-bold text-ink-soft"
              title={item.label}
            >
              {item.label}
            </span>
            <span className="shrink-0 text-xs font-extrabold text-ink">
              {item.value}
              {item.suffix ?? ""}
            </span>
          </div>
          <div className="h-2 rounded-full bg-panel-strong">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.max((item.value / max) * 100, item.value > 0 ? 3 : 0)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
