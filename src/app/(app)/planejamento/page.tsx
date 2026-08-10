import type { Metadata } from "next";
import { SwotGrid } from "@/components/swot/SwotGrid";
import { prisma } from "@/lib/db";
import type { SwotItemDTO } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Planejamento" };

export default async function PlanejamentoPage() {
  const items = await prisma.swotItem.findMany({
    where: { applicationId: null },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 md:px-6 md:py-6">
      <div className="mb-4 md:mb-5">
        <h1 className="text-lg font-extrabold tracking-tight text-ink md:text-xl">
          Planejamento de carreira
        </h1>
        <p className="mt-1 max-w-2xl text-sm font-semibold text-ink-soft">
          Sua análise SWOT geral: forças e fraquezas do seu perfil,
          oportunidades e ameaças do mercado. Cada vaga também tem um SWOT
          próprio na aba SWOT do card.
        </p>
      </div>

      <SwotGrid applicationId={null} initialItems={items as SwotItemDTO[]} />
    </div>
  );
}
