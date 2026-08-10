import type { Metadata } from "next";
import { DraftsSection } from "@/components/documents/DraftsSection";
import { ResumeSection } from "@/components/documents/ResumeSection";
import { prisma } from "@/lib/db";
import type { DocumentDTO, TextDocDTO } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Documentos" };

export default async function DocumentosPage() {
  const [documents, textDocs] = await Promise.all([
    prisma.document.findMany({
      // nunca carregar o campo `data` (bytes) na listagem
      select: {
        id: true,
        name: true,
        fileName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.textDoc.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-3 py-4 md:px-6 md:py-6">
      <div>
        <h1 className="text-lg font-extrabold tracking-tight text-ink md:text-xl">
          Documentos
        </h1>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          Seus currículos e rascunhos de pitch, sempre à mão na hora de
          aplicar.
        </p>
      </div>

      <ResumeSection documents={documents as DocumentDTO[]} />
      <DraftsSection drafts={textDocs as TextDocDTO[]} />
    </div>
  );
}
