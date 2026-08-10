import { REJECTION_REASON_LABELS } from "./domain";
import type { EventDTO, RejectionReason } from "./types";

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Descrição legível de um evento do histórico.
 * Os nomes das etapas são gravados no `data` no momento do evento
 * (imune a renomeações) com fallback para o mapa de etapas atual.
 */
export function describeEvent(
  event: EventDTO,
  stageNameById: Record<string, string>
): string {
  const data = event.data ?? {};
  const from =
    str(data.fromStageName) ??
    (event.fromStageId ? stageNameById[event.fromStageId] : undefined);
  const to =
    str(data.toStageName) ??
    (event.toStageId ? stageNameById[event.toStageId] : undefined);

  switch (event.type) {
    case "CREATED":
      return to ? `Vaga registrada na etapa ${to}` : "Vaga registrada";
    case "STAGE_CHANGED":
      return from && to ? `Movida de ${from} para ${to}` : `Movida para ${to ?? "outra etapa"}`;
    case "REJECTED": {
      const reason = str(data.reason) as RejectionReason | undefined;
      const label = reason ? REJECTION_REASON_LABELS[reason] ?? reason : undefined;
      const note = str(data.note);
      const fromPart = from ? ` (estava em ${from})` : "";
      const notePart = note ? ` — ${note}` : "";
      return `Rejeitada${label ? `: ${label.toLowerCase()}` : ""}${fromPart}${notePart}`;
    }
    case "RESTORED":
      return `Retornou ao funil${to ? ` na etapa ${to}` : ""}`;
    case "NOTE":
      return `Nota: ${str(data.text) ?? ""}`;
    case "EDITED": {
      const fields = Array.isArray(data.fields) ? (data.fields as string[]) : [];
      return fields.length > 0 ? `Editada: ${fields.join(", ")}` : "Editada";
    }
    case "ARCHIVED":
      return "Arquivada";
    case "UNARCHIVED":
      return "Desarquivada";
    default:
      return "Atualização";
  }
}

/** Cor do ponto na timeline por tipo de evento. */
export const EVENT_COLORS: Record<string, string> = {
  CREATED: "#8b5cf6",
  STAGE_CHANGED: "#3b82f6",
  REJECTED: "#ef4444",
  RESTORED: "#10b981",
  NOTE: "#f59e0b",
  EDITED: "#64748b",
  ARCHIVED: "#94a3b8",
  UNARCHIVED: "#2fbfa4",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  CREATED: "Criação",
  STAGE_CHANGED: "Movimentação",
  REJECTED: "Rejeição",
  RESTORED: "Retorno ao funil",
  NOTE: "Nota",
  EDITED: "Edição",
  ARCHIVED: "Arquivamento",
  UNARCHIVED: "Desarquivamento",
};
