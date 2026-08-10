import type { Metadata } from "next";
import { HistoryList, type HistoryEvent } from "@/components/history/HistoryList";
import { prisma } from "@/lib/db";
import type { Section, StageDTO } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Histórico" };

export default async function HistoricoPage() {
  const [stages, events] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: "asc" } }),
    prisma.applicationEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        application: {
          select: {
            id: true,
            company: true,
            roleTitle: true,
            section: true,
            countryCode: true,
            archivedAt: true,
          },
        },
      },
    }),
  ]);

  const rows: HistoryEvent[] = events.map((event) => ({
    id: event.id,
    type: event.type as HistoryEvent["type"],
    fromStageId: event.fromStageId,
    toStageId: event.toStageId,
    data: (event.data ?? null) as HistoryEvent["data"],
    createdAt: event.createdAt,
    application: {
      id: event.application.id,
      company: event.application.company,
      roleTitle: event.application.roleTitle,
      section: event.application.section as Section,
      countryCode: event.application.countryCode,
      archived: event.application.archivedAt !== null,
    },
  }));

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 md:px-6 md:py-6">
      <HistoryList events={rows} stages={stages as StageDTO[]} />
    </div>
  );
}
