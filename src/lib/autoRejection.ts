// Automatic rejection of idle Applications: pure domain rules.
// Only type imports, so Node runs this file (and its tests) directly.
import type { RejectionReason, StageDTO } from "./types";

export const DEFAULT_IDLE_LIMIT_DAYS = 10;
export const IDLE_LIMIT_MIN = 1;
export const IDLE_LIMIT_MAX = 90;

/** Keys of the `Setting` table that hold the switch and the idle limit. */
export const AUTO_REJECTION_SETTING_KEYS = {
  enabled: "autoRejectionEnabled",
  days: "idleLimitDays",
} as const;

const DAY_MS = 86_400_000;

export interface AutoRejectionSettings {
  enabled: boolean;
  /** Idle limit in whole days, the same for every Stage. */
  days: number;
}

/** What the idle clock of one Application is made of. */
export interface IdleClock {
  createdAt: Date;
  nextActionAt: Date | null;
  /**
   * Latest CREATED, STAGE_CHANGED, REJECTED or RESTORED event (the board's
   * stageEnteredAt); null when there is none, falling back to createdAt.
   */
  lastStageEntryAt: Date | null;
  /** Latest UNARCHIVED event: unarchiving restarts the count. */
  lastUnarchivedAt: Date | null;
}

export interface IdleCandidate extends IdleClock {
  id: string;
  stageId: string;
  archivedAt: Date | null;
}

export type IdleStage = Pick<StageDTO, "id" | "name" | "order" | "isRejection">;

export interface IdleRejection {
  applicationId: string;
  fromStageId: string;
  fromStageName: string;
  reason: RejectionReason;
  note: string;
  /** The deadline itself, not the moment the sweep noticed it. */
  rejectedAt: Date;
}

/** Whole days within the allowed range, or null. */
export function parseIdleLimitDays(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const days = Math.round(value);
  return days >= IDLE_LIMIT_MIN && days <= IDLE_LIMIT_MAX ? days : null;
}

/** Stored values of the two settings; on with the default limit when missing. */
export function readAutoRejectionSettings(stored: {
  enabled?: string | null;
  days?: string | null;
}): AutoRejectionSettings {
  const days = stored.days ? parseIdleLimitDays(Number(stored.days)) : null;
  return {
    enabled: stored.enabled !== "false",
    days: days ?? DEFAULT_IDLE_LIMIT_DAYS,
  };
}

/** The latest of: entry into the current Stage, Next action, last unarchive. */
export function idleClockStart(app: IdleClock): Date {
  let latest = (app.lastStageEntryAt ?? app.createdAt).getTime();
  for (const date of [app.nextActionAt, app.lastUnarchivedAt]) {
    if (date && date.getTime() > latest) latest = date.getTime();
  }
  return new Date(latest);
}

/** When the Application completes `limitDays` days idle. */
export function idleDeadline(app: IdleClock, limitDays: number): Date {
  return new Date(idleClockStart(app).getTime() + limitDays * DAY_MS);
}

/**
 * "Outro" in the first (Interest) and last (Offer) non-rejection Stage, where
 * a stalled Application is not a missing reply; "Sem retorno" in between.
 * Resolved by Stage order, never by name.
 */
export function autoRejectionReason(
  stageId: string,
  stages: IdleStage[]
): RejectionReason {
  const orders = stages.filter((s) => !s.isRejection).map((s) => s.order);
  const stage = stages.find((s) => s.id === stageId);
  if (!stage || orders.length === 0) return "SEM_RETORNO";
  const first = Math.min(...orders);
  const last = Math.max(...orders);
  return stage.order === first || stage.order === last
    ? "OUTRO"
    : "SEM_RETORNO";
}

export function autoRejectionNote(limitDays: number, stageName: string): string {
  const days = limitDays === 1 ? "1 dia" : `${limitDays} dias`;
  return `Movida automaticamente após ${days} sem movimentação em ${stageName}.`;
}

/**
 * Applications that have reached the idle limit at `now`, oldest deadline
 * first: moving them in this order, each to the top of the Rejected lane,
 * leaves the most recent deadline on top. `limitDays` null means the
 * automatic rejection is off. Archived and already rejected Applications are
 * never returned.
 */
export function findIdleRejections(
  candidates: IdleCandidate[],
  stages: IdleStage[],
  limitDays: number | null,
  now: Date
): IdleRejection[] {
  const days = parseIdleLimitDays(limitDays);
  if (days === null) return [];

  const stageById = new Map(stages.map((s) => [s.id, s]));
  const due: IdleRejection[] = [];
  for (const app of candidates) {
    const stage = stageById.get(app.stageId);
    if (!stage || stage.isRejection || app.archivedAt) continue;
    const deadline = idleDeadline(app, days);
    if (now.getTime() < deadline.getTime()) continue;
    due.push({
      applicationId: app.id,
      fromStageId: stage.id,
      fromStageName: stage.name,
      reason: autoRejectionReason(stage.id, stages),
      note: autoRejectionNote(days, stage.name),
      rejectedAt: deadline,
    });
  }

  return due.sort(
    (a, b) =>
      a.rejectedAt.getTime() - b.rejectedAt.getTime() ||
      a.applicationId.localeCompare(b.applicationId)
  );
}
