"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertSession } from "@/lib/session";
import type { ActionResult } from "./applications";

export async function saveWeeklyGoal(goal: number): Promise<ActionResult> {
  try {
    await assertSession();
    const value = Math.round(goal);
    if (!Number.isFinite(value) || value < 1 || value > 200) {
      return { ok: false, error: "Meta inválida (use um número de 1 a 200)." };
    }
    await prisma.setting.upsert({
      where: { key: "weeklyGoal" },
      update: { value: String(value) },
      create: { key: "weeklyGoal", value: String(value) },
    });
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error("Erro ao salvar a meta.", error);
    return { ok: false, error: "Erro ao salvar a meta." };
  }
}
