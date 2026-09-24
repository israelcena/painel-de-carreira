"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { listDocumentsForUi } from "@/lib/documents";
import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_TOO_LARGE,
} from "@/lib/domain";
import { assertSession } from "@/lib/session";
import type { DocumentDTO } from "@/lib/types";
import type { ActionResult } from "./applications";

// Regra do arquivo: todo acesso a `document` usa `select` explícito. O campo
// `data` (bytes, até 8 MB) só deve ser lido pela rota de download.

function fail(error: unknown, fallback: string): { ok: false; error: string } {
  console.error(fallback, error);
  const message = error instanceof Error ? error.message : fallback;
  return { ok: false, error: message };
}

/** O vínculo aparece no card do quadro, então a troca revalida o app inteiro. */
function refresh() {
  revalidatePath("/", "layout");
}

interface UploadedFile {
  name: string;
  fileName: string;
  mimeType: string;
  size: number;
  data: Buffer<ArrayBuffer>;
}

/**
 * Valida o arquivo do formulário (campos `file` e `name`). Nome da versão: o
 * informado, senão `fallbackName`, senão o nome do arquivo sem extensão.
 */
async function readUpload(
  formData: FormData,
  fallbackName?: string
): Promise<{ ok: true; file: UploadedFile } | { ok: false; error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione um arquivo." };
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    return { ok: false, error: DOCUMENT_TOO_LARGE };
  }

  const fileName = file.name;
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  if (!DOCUMENT_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      error: `Formato não suportado. Use: ${DOCUMENT_EXTENSIONS.join(", ")}`,
    };
  }

  const providedName = String(formData.get("name") ?? "").trim();
  const name =
    providedName ||
    fallbackName ||
    fileName.slice(0, fileName.lastIndexOf(".")) ||
    fileName;

  return {
    ok: true,
    file: {
      name,
      fileName,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      data: Buffer.from(await file.arrayBuffer()),
    },
  };
}

/**
 * Evento de histórico da troca de currículo. Usa o tipo EDITED; o
 * `describeEvent` reconhece `resumeName`/`previousResumeName` no `data`.
 */
function resumeEvent(
  resumeName: string | null,
  previousResumeName: string | null,
  reason?: string
) {
  return {
    type: "EDITED" as const,
    data: {
      fields: ["currículo"],
      resumeName,
      previousResumeName,
      ...(reason ? { reason } : {}),
    } as Prisma.InputJsonValue,
  };
}

export async function uploadDocument(
  formData: FormData
): Promise<ActionResult> {
  try {
    await assertSession();

    const upload = await readUpload(formData);
    if (!upload.ok) return upload;

    await prisma.document.create({
      data: upload.file,
      select: { id: true },
    });

    revalidatePath("/documentos");
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao enviar o arquivo.");
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  try {
    await assertSession();

    const doc = await prisma.document.findUnique({
      where: { id },
      select: { name: true, applications: { select: { id: true } } },
    });
    if (!doc) return { ok: false, error: "Documento não encontrado." };

    // O FK (ON DELETE SET NULL) desvincula as vagas; o evento fica no
    // histórico de cada uma para não perder qual currículo tinha sido enviado.
    await prisma.$transaction([
      prisma.applicationEvent.createMany({
        data: doc.applications.map((app) => ({
          applicationId: app.id,
          ...resumeEvent(null, doc.name, "documento excluído"),
        })),
      }),
      prisma.document.delete({ where: { id }, select: { id: true } }),
    ]);

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao excluir o arquivo.");
  }
}

export async function listDocuments(): Promise<ActionResult<DocumentDTO[]>> {
  try {
    await assertSession();
    return { ok: true, data: await listDocumentsForUi() };
  } catch (error) {
    return fail(error, "Erro ao carregar os currículos.");
  }
}

/** Vincula uma versão da biblioteca à vaga (`null` remove o vínculo). */
export async function setApplicationResume(
  applicationId: string,
  documentId: string | null
): Promise<ActionResult> {
  try {
    await assertSession();

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true, resumeId: true, resume: { select: { name: true } } },
    });
    if (!app) return { ok: false, error: "Vaga não encontrada." };
    if ((documentId || null) === app.resumeId) return { ok: true };

    let next: { id: string; name: string } | null = null;
    if (documentId) {
      next = await prisma.document.findUnique({
        where: { id: documentId },
        select: { id: true, name: true },
      });
      if (!next) return { ok: false, error: "Currículo não encontrado." };
    }

    await prisma.application.update({
      where: { id: app.id },
      data: {
        resumeId: next?.id ?? null,
        events: {
          create: resumeEvent(next?.name ?? null, app.resume?.name ?? null),
        },
      },
      select: { id: true },
    });

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao vincular o currículo.");
  }
}

/** Envia um arquivo novo para a biblioteca e já o vincula à vaga. */
export async function uploadApplicationResume(
  applicationId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await assertSession();

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true, company: true, resume: { select: { name: true } } },
    });
    if (!app) return { ok: false, error: "Vaga não encontrada." };

    const upload = await readUpload(formData, `CV — ${app.company}`);
    if (!upload.ok) return upload;

    // Escrita aninhada: documento, vínculo e evento entram juntos
    await prisma.application.update({
      where: { id: app.id },
      data: {
        resume: { create: upload.file },
        events: {
          create: resumeEvent(upload.file.name, app.resume?.name ?? null),
        },
      },
      select: { id: true },
    });

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao enviar o currículo.");
  }
}
