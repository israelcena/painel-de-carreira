"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertSession } from "@/lib/session";
import type { SwotItemDTO, SwotQuadrant } from "@/lib/types";
import type { ActionResult } from "./applications";

const QUADRANTS: SwotQuadrant[] = [
  "FORCA",
  "FRAQUEZA",
  "OPORTUNIDADE",
  "AMEACA",
];

function fail(error: unknown, fallback: string): { ok: false; error: string } {
  console.error(fallback, error);
  const message = error instanceof Error ? error.message : fallback;
  return { ok: false, error: message };
}

function toDTO(item: {
  id: string;
  applicationId: string | null;
  quadrant: string;
  text: string;
  createdAt: Date;
}): SwotItemDTO {
  return {
    id: item.id,
    applicationId: item.applicationId,
    quadrant: item.quadrant as SwotQuadrant,
    text: item.text,
    createdAt: item.createdAt,
  };
}

/** Itens SWOT de uma vaga (id) ou do SWOT geral de carreira (null). */
export async function getSwotItems(
  applicationId: string | null
): Promise<ActionResult<SwotItemDTO[]>> {
  try {
    await assertSession();
    const items = await prisma.swotItem.findMany({
      where: { applicationId },
      orderBy: { createdAt: "asc" },
    });
    return { ok: true, data: items.map(toDTO) };
  } catch (error) {
    return fail(error, "Erro ao carregar a análise SWOT.");
  }
}

export async function addSwotItem(input: {
  applicationId: string | null;
  quadrant: SwotQuadrant;
  text: string;
}): Promise<ActionResult<SwotItemDTO>> {
  try {
    await assertSession();

    const text = input.text.trim();
    if (!text) return { ok: false, error: "Escreva o item." };
    if (text.length > 500)
      return { ok: false, error: "Item muito longo (máx. 500 caracteres)." };
    if (!QUADRANTS.includes(input.quadrant))
      return { ok: false, error: "Quadrante inválido." };

    if (input.applicationId) {
      const exists = await prisma.application.findUnique({
        where: { id: input.applicationId },
        select: { id: true },
      });
      if (!exists) return { ok: false, error: "Vaga não encontrada." };
    }

    const item = await prisma.swotItem.create({
      data: {
        applicationId: input.applicationId,
        quadrant: input.quadrant,
        text,
      },
    });

    revalidatePath("/planejamento");
    return { ok: true, data: toDTO(item) };
  } catch (error) {
    return fail(error, "Erro ao adicionar o item.");
  }
}

export async function removeSwotItem(id: string): Promise<ActionResult> {
  try {
    await assertSession();
    await prisma.swotItem.delete({ where: { id } });
    revalidatePath("/planejamento");
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao remover o item.");
  }
}
