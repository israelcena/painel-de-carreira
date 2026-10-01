// Corrections of a Rejection ("Editar motivo") and how a Rejection's reason
// counts in the Response rate: pure domain rules.
// Only type imports, so Node runs this file (and its tests) directly.
import type { RejectionReason } from "./types";

/** The reason that does not count as a reply in the Response rate. */
const NO_REPLY: RejectionReason = "SEM_RETORNO";

/** Events that enter a Stage (as in the board's stageEnteredAt). */
const STAGE_ENTRY_TYPES = new Set([
  "CREATED",
  "STAGE_CHANGED",
  "REJECTED",
  "RESTORED",
]);

/** History labels (UI text, PT-BR) of what a correction can change. */
export const REJECTION_FIELD_LABELS = {
  reason: "motivo",
  rejectedAt: "data",
  note: "detalhes",
} as const;

export interface RejectionValues {
  reason: RejectionReason | null;
  note: string | null;
  rejectedAt: Date | null;
}

/**
 * Labels of what a correction changes, in the order of the rejection form;
 * empty when nothing changed (nothing to save or record).
 */
export function rejectionCorrectionFields(
  current: RejectionValues,
  next: RejectionValues
): string[] {
  const fields: string[] = [];
  if (current.reason !== next.reason) fields.push(REJECTION_FIELD_LABELS.reason);
  if (current.rejectedAt?.getTime() !== next.rejectedAt?.getTime()) {
    fields.push(REJECTION_FIELD_LABELS.rejectedAt);
  }
  if (current.note !== next.note) fields.push(REJECTION_FIELD_LABELS.note);
  return fields;
}

export type RejectionCorrectionData = {
  rejectionCorrection: true;
  fields: string[];
  reason: RejectionReason;
  previousReason: RejectionReason | null;
  note: string | null;
};

/**
 * Data of the EDITED event that records a correction. A correction is an
 * edit, not a REJECTED event: it is no new entry into the Rejected Stage
 * (days in Stage, recency order and date filters keep the original entry) and
 * the History does not read it as a second Rejection.
 */
export function rejectionCorrectionData(
  correction: Omit<RejectionCorrectionData, "rejectionCorrection">
): RejectionCorrectionData {
  return { rejectionCorrection: true, ...correction };
}

export function isRejectionCorrection(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { rejectionCorrection?: unknown }).rejectionCorrection === true
  );
}

function reasonOf(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const reason = (data as { reason?: unknown }).reason;
  return typeof reason === "string" && reason.length > 0 ? reason : undefined;
}

/** What a History event needs to follow the Rejections of an Application. */
export interface HistoryEntry {
  type: string;
  toStageId: string | null;
  data: unknown;
}

/**
 * Whether a past Rejection of the Application, one it has since left, ended
 * with a reason other than "no reply", which counts as a reply in the
 * Response rate. Only each Rejection's final reason counts: a correction
 * replaces the reason it was recorded with. The Rejection the Application is
 * still in (`stillRejected`) is left out, because its current reason on the
 * Application decides. `events` must be in chronological order.
 */
export function repliedInPastRejection(
  events: readonly HistoryEntry[],
  isRejectionStage: (stageId: string) => boolean,
  stillRejected: boolean
): boolean {
  let open = false;
  let reason: string | undefined;
  const replied = () => open && reason !== undefined && reason !== NO_REPLY;

  for (const event of events) {
    if (event.type === "EDITED") {
      if (open && isRejectionCorrection(event.data)) {
        reason = reasonOf(event.data) ?? reason;
      }
      continue;
    }
    if (!STAGE_ENTRY_TYPES.has(event.type) || !event.toStageId) continue;
    if (isRejectionStage(event.toStageId)) {
      // A new Rejection, or a correction recorded as REJECTED before
      // corrections became edits: either way, the latest reason wins
      open = true;
      reason = reasonOf(event.data);
      continue;
    }
    // Entering a non-rejection Stage closes the Rejection
    if (replied()) return true;
    open = false;
    reason = undefined;
  }

  // Still open at the end: the current Rejection, unless the Application
  // left it without a recorded event
  return !stillRejected && replied();
}
