// Server-only module (plain, not "use server"): the sweep must never become
// an action the client can call.
import type { EventType, Prisma } from "@prisma/client";
import {
  AUTO_REJECTION_SETTING_KEYS,
  findIdleRejections,
  readAutoRejectionSettings,
  type AutoRejectionSettings,
  type IdleCandidate,
} from "./autoRejection";
import { prisma } from "./db";

const DAY_MS = 86_400_000;

// Events that start the idle clock: entering a Stage (as in the board's
// stageEnteredAt) and unarchiving.
const CLOCK_EVENTS: EventType[] = [
  "CREATED",
  "STAGE_CHANGED",
  "REJECTED",
  "RESTORED",
  "UNARCHIVED",
];

/** Switch and idle limit as stored; on with the default limit when missing. */
export async function getAutoRejectionSettings(): Promise<AutoRejectionSettings> {
  const rows = await prisma.setting.findMany({
    where: {
      key: {
        in: [AUTO_REJECTION_SETTING_KEYS.enabled, AUTO_REJECTION_SETTING_KEYS.days],
      },
    },
  });
  const value = (key: string) => rows.find((row) => row.key === key)?.value;
  return readAutoRejectionSettings({
    enabled: value(AUTO_REJECTION_SETTING_KEYS.enabled),
    days: value(AUTO_REJECTION_SETTING_KEYS.days),
  });
}

/**
 * Moves every idle Application to the Rejected Stage (rules in
 * autoRejection.ts). Awaited at the start of rendering the pages that show
 * Stage-dependent data, before they read it: there is no cron. Safe under
 * concurrent page loads and never throws, so a failure only skips this round.
 * Does not revalidate: the calling page reads the fresh data right after.
 */
export async function runAutoRejectionSweep(now = new Date()): Promise<void> {
  try {
    await sweep(now);
  } catch (error) {
    console.error("Automatic rejection sweep failed.", error);
  }
}

async function sweep(now: Date): Promise<void> {
  const settings = await getAutoRejectionSettings();
  if (!settings.enabled) return;

  // Cheap prefilter: only Applications with no Next action, stage entry or
  // unarchive after the cutoff can be due, so a normal load returns nothing.
  const cutoff = new Date(now.getTime() - settings.days * DAY_MS);
  const apps = await prisma.application.findMany({
    where: {
      archivedAt: null,
      stage: { isRejection: false },
      OR: [{ nextActionAt: null }, { nextActionAt: { lte: cutoff } }],
      events: {
        none: {
          type: { in: CLOCK_EVENTS },
          createdAt: { gt: cutoff },
        },
      },
    },
    select: {
      id: true,
      stageId: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
      nextActionAt: true,
      events: {
        where: { type: { in: CLOCK_EVENTS } },
        orderBy: { createdAt: "desc" },
        select: { type: true, createdAt: true },
      },
    },
  });
  if (apps.length === 0) return;

  const stages = await prisma.stage.findMany({
    select: { id: true, name: true, order: true, isRejection: true },
  });
  const rejectionStage = stages.find((s) => s.isRejection);
  if (!rejectionStage) return;

  const candidates: IdleCandidate[] = apps.map((app) => ({
    id: app.id,
    stageId: app.stageId,
    archivedAt: app.archivedAt,
    createdAt: app.createdAt,
    nextActionAt: app.nextActionAt,
    lastStageEntryAt:
      app.events.find((e) => e.type !== "UNARCHIVED")?.createdAt ?? null,
    lastUnarchivedAt:
      app.events.find((e) => e.type === "UNARCHIVED")?.createdAt ?? null,
  }));
  const due = findIdleRejections(candidates, stages, settings.days, now);
  if (due.length === 0) return;

  // Top of the Rejected lane, like startOfColumnPosition in
  // actions/applications.ts; oldest deadline first, so the newest ends on top.
  const first = await prisma.application.findFirst({
    where: { stageId: rejectionStage.id, archivedAt: null },
    orderBy: { position: "asc" },
    select: { position: true },
  });
  let top = first?.position ?? 2048;
  const updatedAtById = new Map(apps.map((app) => [app.id, app.updatedAt]));

  for (const rejection of due) {
    const position = top - 1024;
    try {
      const moved = await prisma.$transaction(async (tx) => {
        // Conditional move: a concurrent sweep or an edit made since the read
        // (stage, archive, Next action...) leaves no row to update.
        const { count } = await tx.application.updateMany({
          where: {
            id: rejection.applicationId,
            stageId: rejection.fromStageId,
            archivedAt: null,
            updatedAt: updatedAtById.get(rejection.applicationId),
          },
          data: {
            stageId: rejectionStage.id,
            position,
            rejectionReason: rejection.reason,
            rejectionNote: rejection.note,
            rejectedAt: rejection.rejectedAt,
            rejectedFromStageId: rejection.fromStageId,
          },
        });
        if (count !== 1) return false;

        // Dated at the deadline, not the load: time per Stage, the date in
        // the History, days in Stage and the recency order in Rejected
        await tx.applicationEvent.create({
          data: {
            applicationId: rejection.applicationId,
            type: "REJECTED",
            fromStageId: rejection.fromStageId,
            toStageId: rejectionStage.id,
            createdAt: rejection.rejectedAt,
            data: {
              reason: rejection.reason,
              note: rejection.note,
              fromStageName: rejection.fromStageName,
              toStageName: rejectionStage.name,
              automatic: true,
              idleLimitDays: settings.days,
            } as Prisma.InputJsonValue,
          },
        });
        return true;
      });
      if (moved) top = position;
    } catch (error) {
      console.error(
        `Automatic rejection failed for application ${rejection.applicationId}.`,
        error
      );
    }
  }
}
