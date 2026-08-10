"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertSession } from "@/lib/session";
import type { ActionResult } from "./applications";

function fail(error: unknown, fallback: string): { ok: false; error: string } {
  console.error(fallback, error);
  const message = error instanceof Error ? error.message : fallback;
  return { ok: false, error: message };
}

export async function createTextDoc(
  title: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertSession();
    const cleanTitle = title.trim();
    if (!cleanTitle) return { ok: false, error: "Dê um título ao rascunho." };

    const doc = await prisma.textDoc.create({
      data: { title: cleanTitle },
      select: { id: true },
    });

    revalidatePath("/documentos");
    return { ok: true, data: doc };
  } catch (error) {
    return fail(error, "Erro ao criar o rascunho.");
  }
}

export async function saveTextDoc(
  id: string,
  input: { title?: string; content: string }
): Promise<ActionResult> {
  try {
    await assertSession();
    const title = input.title?.trim();
    await prisma.textDoc.update({
      where: { id },
      data: {
        content: input.content,
        ...(title ? { title } : {}),
      },
    });
    revalidatePath("/documentos");
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao salvar o rascunho.");
  }
}

export async function deleteTextDoc(id: string): Promise<ActionResult> {
  try {
    await assertSession();
    await prisma.textDoc.delete({ where: { id } });
    revalidatePath("/documentos");
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao excluir o rascunho.");
  }
}
