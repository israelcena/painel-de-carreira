import { describeEvent, EVENT_COLORS } from "@/lib/events";
import { formatDateTime, relativeTime } from "@/lib/format";
import type { EventDTO } from "@/lib/types";

/**
 * Linha do tempo dos eventos de uma vaga (mais recente em cima). Usada na
 * aba Histórico do modal e na visão da vaga. `null` = ainda carregando.
 */
export function EventTimeline({
  events,
  stageNameById,
}: {
  events: EventDTO[] | null;
  stageNameById: Record<string, string>;
}) {
  if (events === null) {
    return (
      <p className="py-6 text-center text-sm font-semibold text-muted">
        Carregando histórico...
      </p>
    );
  }
  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-sm font-semibold text-muted">
        Nenhum evento registrado.
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l-2 border-line pl-4">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            className="absolute -left-[1.4375rem] top-1 size-3 rounded-full border-2 border-white"
            style={{
              backgroundColor: EVENT_COLORS[event.type] ?? "#8a92b2",
            }}
          />
          <p className="text-sm font-bold leading-snug text-ink">
            {describeEvent(event, stageNameById)}
          </p>
          <p
            className="text-[11px] font-semibold text-muted"
            title={formatDateTime(event.createdAt)}
          >
            {formatDateTime(event.createdAt)} · {relativeTime(event.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}
