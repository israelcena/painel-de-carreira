import { notFound } from "next/navigation";
import { Board } from "@/components/board/Board";
import { prisma } from "@/lib/db";
import { SECTION_BY_SLUG, SECTION_LABELS } from "@/lib/domain";
import type { AppCard, SectionSlug, StageDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/board/[section]">) {
  const { section: slug } = await params;
  const section = SECTION_BY_SLUG[slug as SectionSlug];
  return { title: section ? `Quadro ${SECTION_LABELS[section]}` : "Quadro" };
}

export default async function BoardPage({
  params,
}: PageProps<"/board/[section]">) {
  const { section: slug } = await params;
  const section = SECTION_BY_SLUG[slug as SectionSlug];
  if (!section) notFound();

  const [stages, applications] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: "asc" } }),
    prisma.application.findMany({
      where: { section, archivedAt: null },
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
      },
    }),
  ]);

  const cards: AppCard[] = applications.map((app) => ({
    id: app.id,
    section: app.section,
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
    rejectionReason: app.rejectionReason,
    rejectionNote: app.rejectionNote,
    rejectedAt: app.rejectedAt,
    rejectedFromStageId: app.rejectedFromStageId,
    createdAt: app.createdAt,
    noteCount: app._count.events,
    stageEnteredAt: app.events[0]?.createdAt ?? app.createdAt,
  }));

  return (
    <Board section={section} stages={stages as StageDTO[]} apps={cards} />
  );
}
