"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertSession } from "@/lib/session";
import type { ActionResult } from "./applications";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".odt",
  ".rtf",
  ".txt",
  ".md",
];

function fail(error: unknown, fallback: string): { ok: false; error: string } {
  console.error(fallback, error);
  const message = error instanceof Error ? error.message : fallback;
  return { ok: false, error: message };
}

export async function uploadDocument(
  formData: FormData
): Promise<ActionResult> {
  try {
    await assertSession();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Selecione um arquivo." };
    }
    if (file.size > MAX_SIZE) {
      return { ok: false, error: "Arquivo muito grande (máx. 8 MB)." };
    }

    const fileName = file.name;
    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        ok: false,
        error: `Formato não suportado. Use: ${ALLOWED_EXTENSIONS.join(", ")}`,
      };
    }

    const providedName = String(formData.get("name") ?? "").trim();
    const name =
      providedName || fileName.slice(0, fileName.lastIndexOf(".")) || fileName;

    const data = Buffer.from(await file.arrayBuffer());

    await prisma.document.create({
      data: {
        name,
        fileName,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        data,
      },
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
    await prisma.document.delete({ where: { id } });
    revalidatePath("/documentos");
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao excluir o arquivo.");
  }
}
