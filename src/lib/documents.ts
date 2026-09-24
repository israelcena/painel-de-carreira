import { prisma } from "./db";
import type { DocumentDTO } from "./types";

/**
 * Biblioteca de documentos para as telas (página Documentos e aba Currículo
 * da vaga), com as vagas que usam cada um. Nunca carrega o campo `data` (bytes).
 */
export async function listDocumentsForUi(): Promise<DocumentDTO[]> {
  const documents = await prisma.document.findMany({
    select: {
      id: true,
      name: true,
      fileName: true,
      mimeType: true,
      size: true,
      createdAt: true,
      applications: {
        select: { id: true, company: true, roleTitle: true, archivedAt: true },
        orderBy: { company: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return documents.map(({ applications, ...doc }) => ({
    ...doc,
    usedIn: applications.map((app) => ({
      id: app.id,
      company: app.company,
      roleTitle: app.roleTitle,
      archived: app.archivedAt !== null,
    })),
  }));
}
