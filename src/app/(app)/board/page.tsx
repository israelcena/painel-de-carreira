import type { Metadata } from "next";
import { Board } from "@/components/board/Board";
import { prisma } from "@/lib/db";
import type { AppCard, StageDTO } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Quadro" };

export default async function BoardPage() {
  const [stages, applications] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: "asc" } }),
    prisma.application.findMany({
      where: { archivedAt: null },
      orderBy: { position: "asc" },
      include: {
        _count: {
          select: { events: { where: { type: "NOTE" } } },
        },
        events: {
          where: {
            type: { in: ["CREATED", "STAGE_CHANGED", "REJECTED", "RESTORED"] },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        // Select explícito: nunca carregar os bytes do currículo no quadro
        resume: { select: { id: true, name: true, fileName: true } },
      },
    }),
  ]);

  const cards: AppCard[] = applications.map((app) => ({
    id: app.id,
    stageId: app.stageId,
    position: app.position,
    company: app.company,
    roleTitle: app.roleTitle,
    jobUrl: app.jobUrl,
    platform: app.platform,
    locationCity: app.locationCity,
    workModel: app.workModel,
    countryCode: app.countryCode,
    salary: app.salary,
    priority: app.priority,
    appliedAt: app.appliedAt,
    notes: app.notes,
    jobDescription: app.jobDescription,
    applicationUrl: app.applicationUrl,
    nextActionNote: app.nextActionNote,
    nextActionAt: app.nextActionAt,
    rejectionReason: app.rejectionReason,
    rejectionNote: app.rejectionNote,
    rejectedAt: app.rejectedAt,
    rejectedFromStageId: app.rejectedFromStageId,
    createdAt: app.createdAt,
    noteCount: app._count.events,
    stageEnteredAt: app.events[0]?.createdAt ?? app.createdAt,
    resume: app.resume,
  }));

  return <Board stages={stages as StageDTO[]} apps={cards} />;
}
