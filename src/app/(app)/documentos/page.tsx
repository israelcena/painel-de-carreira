import type { Metadata } from "next";
import { DraftsSection } from "@/components/documents/DraftsSection";
import { ResumeSection } from "@/components/documents/ResumeSection";
import { prisma } from "@/lib/db";
import { listDocumentsForUi } from "@/lib/documents";
import type { TextDocDTO } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Documentos" };

export default async function DocumentosPage() {
  const [documents, textDocs] = await Promise.all([
    listDocumentsForUi(),
    prisma.textDoc.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 px-3 py-4 md:px-6 md:py-6">
      <div>
        <h1 className="text-lg font-extrabold tracking-tight text-ink md:text-xl">
          Documentos
        </h1>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Seus currículos e rascunhos de pitch, sempre à mão na hora de
          aplicar.
        </p>
      </div>

      {/* Em telas gigantes, currículos e rascunhos ficam lado a lado; os
          rascunhos (texto longo, dois por linha) levam a coluna mais larga */}
      <div className="grid grid-cols-1 items-start gap-6 3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ResumeSection documents={documents} />
        <DraftsSection drafts={textDocs as TextDocDTO[]} />
      </div>
    </div>
  );
}
