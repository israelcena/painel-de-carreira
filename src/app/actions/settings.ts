"use server";

import { revalidatePath } from "next/cache";
import {
  AUTO_REJECTION_SETTING_KEYS,
  parseIdleLimitDays,
} from "@/lib/autoRejection";
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

export async function saveAutoRejection(params: {
  enabled: boolean;
  days: number;
}): Promise<ActionResult> {
  try {
    await assertSession();
    const days = parseIdleLimitDays(params.days);
    if (days === null) {
      return { ok: false, error: "Prazo inválido (use um número de 1 a 90)." };
    }
    const upsert = (key: string, value: string) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    await prisma.$transaction([
      upsert(AUTO_REJECTION_SETTING_KEYS.enabled, String(params.enabled === true)),
      upsert(AUTO_REJECTION_SETTING_KEYS.days, String(days)),
    ]);
    // The re-render runs the sweep: Applications already past the new limit
    // move right away (retroactive by design).
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("Failed to save the automatic rejection settings.", error);
    return { ok: false, error: "Erro ao salvar a rejeição automática." };
  }
}
