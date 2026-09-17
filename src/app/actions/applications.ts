"use server";

import type { EventType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isKnownCountry } from "@/lib/countries";
import { prisma } from "@/lib/db";
import { dateFromInput } from "@/lib/format";
import { assertSession } from "@/lib/session";
import type {
  EventDTO,
  Priority,
  RejectionReason,
  WorkModel,
} from "@/lib/types";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const PRIORITIES: Priority[] = ["BAIXA", "MEDIA", "ALTA"];
const WORK_MODELS: WorkModel[] = ["REMOTO", "HIBRIDO", "PRESENCIAL"];
const REJECTION_REASONS: RejectionReason[] = [
  "SEM_RETORNO",
  "PERFIL_NAO_ADERENTE",
  "EXPERIENCIA",
  "PRETENSAO_SALARIAL",
  "IDIOMA",
  "TESTE_TECNICO",
  "ENTREVISTA",
  "VAGA_ENCERRADA",
  "VISTO_LOCALIZACAO",
  "OUTRO",
];

const FIELD_LABELS: Record<string, string> = {
  company: "empresa",
  roleTitle: "cargo",
  jobUrl: "link da vaga",
  platform: "plataforma",
  locationCity: "cidade",
  workModel: "modelo de trabalho",
  countryCode: "país",
  salary: "salário",
  priority: "prioridade",
  appliedAt: "data de aplicação",
  notes: "observações",
  jobDescription: "descrição da vaga",
  applicationUrl: "link da candidatura",
  nextActionNote: "próxima ação",
  nextActionAt: "data da próxima ação",
};

export interface ApplicationInput {
  company: string;
  roleTitle: string;
  /** ISO-3166 alpha-2 — obrigatório em toda vaga ("BR" para vagas no Brasil). */
  countryCode: string;
  stageId?: string;
  jobUrl?: string | null;
  platform?: string | null;
  locationCity?: string | null;
  workModel?: WorkModel | null;
  salary?: string | null;
  priority?: Priority;
  appliedAt?: string | null; // "YYYY-MM-DD"
  notes?: string | null;
  jobDescription?: string | null;
  applicationUrl?: string | null;
  nextActionNote?: string | null;
  nextActionAt?: string | null; // "YYYY-MM-DD"
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function fail(error: unknown, fallback: string): { ok: false; error: string } {
  console.error(fallback, error);
  const message = error instanceof Error ? error.message : fallback;
  return { ok: false, error: message };
}

function refresh() {
  revalidatePath("/", "layout");
}

/**
 * Normaliza e valida o país. Toda vaga tem país desde a migration
 * remove_section_country_required (o quadro é único; Brasil × exterior deriva daqui).
 */
function parseCountry(
  value: string | null | undefined
): { ok: true; code: string } | { ok: false; error: string } {
  const code = clean(value)?.toUpperCase();
  if (!code || !isKnownCountry(code)) {
    return { ok: false, error: "Selecione o país da vaga." };
  }
  return { ok: true, code };
}

/** Posição acima do primeiro card da coluna: entradas novas ficam no topo da raia. */
async function startOfColumnPosition(stageId: string): Promise<number> {
  const first = await prisma.application.findFirst({
    where: { stageId, archivedAt: null },
    orderBy: { position: "asc" },
    select: { position: true },
  });
  return (first?.position ?? 2048) - 1024;
}

const STAGE_ENTRY_EVENTS: EventType[] = [
  "CREATED",
  "STAGE_CHANGED",
  "REJECTED",
  "RESTORED",
];

/**
 * Reatribui `position` dos cards ativos de uma raia para refletir a ordem
 * "entrou na etapa mais recentemente primeiro" (desempate: cadastro mais novo).
 * Sem evento: reordenar dentro da raia é silencioso, como em moveApplication.
 */
async function reorderStage(stageId: string): Promise<void> {
  const apps = await prisma.application.findMany({
    where: { stageId, archivedAt: null },
    select: {
      id: true,
      createdAt: true,
      events: {
        where: { type: { in: STAGE_ENTRY_EVENTS } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const ordered = apps
    .map((app) => ({
      id: app.id,
      enteredAt: (app.events[0]?.createdAt ?? app.createdAt).getTime(),
      createdAt: app.createdAt.getTime(),
    }))
    .sort((a, b) => b.enteredAt - a.enteredAt || b.createdAt - a.createdAt);

  if (ordered.length === 0) return;

  await prisma.$transaction(
    ordered.map((app, index) =>
      prisma.application.update({
        where: { id: app.id },
        data: { position: (index + 1) * 1024 },
      })
    )
  );
}

export async function reorderStageByRecency(params: {
  stageId: string;
}): Promise<ActionResult> {
  try {
    await assertSession();
    const stage = await prisma.stage.findUnique({
      where: { id: params.stageId },
      select: { id: true },
    });
    if (!stage) return { ok: false, error: "Etapa inválida." };

    await reorderStage(stage.id);
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao ordenar a raia.");
  }
}

export async function reorderBoardByRecency(): Promise<ActionResult> {
  try {
    await assertSession();

    const stages = await prisma.stage.findMany({ select: { id: true } });
    for (const stage of stages) {
      await reorderStage(stage.id);
    }
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao ordenar o quadro.");
  }
}

export async function createApplication(
  input: ApplicationInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertSession();

    const company = clean(input.company);
    const roleTitle = clean(input.roleTitle);
    if (!company) return { ok: false, error: "Informe a empresa." };
    if (!roleTitle) return { ok: false, error: "Informe o cargo." };

    const country = parseCountry(input.countryCode);
    if (!country.ok) return country;

    const stage = input.stageId
      ? await prisma.stage.findUnique({ where: { id: input.stageId } })
      : await prisma.stage.findFirst({ orderBy: { order: "asc" } });
    if (!stage) return { ok: false, error: "Etapa inválida." };
    if (stage.isRejection) {
      return {
        ok: false,
        error: "Crie a vaga em uma etapa ativa e depois registre a rejeição.",
      };
    }

    const position = await startOfColumnPosition(stage.id);

    const created = await prisma.application.create({
      data: {
        stageId: stage.id,
        position,
        company,
        roleTitle,
        jobUrl: clean(input.jobUrl),
        platform: clean(input.platform),
        locationCity: clean(input.locationCity),
        workModel:
          input.workModel && WORK_MODELS.includes(input.workModel)
            ? input.workModel
            : null,
        countryCode: country.code,
        salary: clean(input.salary),
        priority:
          input.priority && PRIORITIES.includes(input.priority)
            ? input.priority
            : "MEDIA",
        appliedAt: input.appliedAt ? dateFromInput(input.appliedAt) : null,
        notes: clean(input.notes),
        jobDescription: clean(input.jobDescription),
        applicationUrl: clean(input.applicationUrl),
        nextActionNote: clean(input.nextActionNote),
        nextActionAt: input.nextActionAt
          ? dateFromInput(input.nextActionAt)
          : null,
        events: {
          create: {
            type: "CREATED",
            toStageId: stage.id,
            data: { toStageName: stage.name } as Prisma.InputJsonValue,
          },
        },
      },
      select: { id: true },
    });

    refresh();
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return fail(error, "Erro ao criar a vaga.");
  }
}

export async function moveApplication(params: {
  id: string;
  toStageId: string;
  position: number;
}): Promise<ActionResult> {
  try {
    await assertSession();

    const app = await prisma.application.findUnique({
      where: { id: params.id },
      include: { stage: true },
    });
    if (!app) return { ok: false, error: "Vaga não encontrada." };

    // Reordenação dentro da mesma coluna: sem evento
    if (app.stageId === params.toStageId) {
      await prisma.application.update({
        where: { id: app.id },
        data: { position: params.position },
      });
      refresh();
      return { ok: true };
    }

    const toStage = await prisma.stage.findUnique({
      where: { id: params.toStageId },
    });
    if (!toStage) return { ok: false, error: "Etapa de destino inválida." };
    if (toStage.isRejection) {
      return {
        ok: false,
        error: "Use a ação de rejeição para mover para Rejeitado.",
      };
    }

    const leavingRejection = app.stage.isRejection;

    await prisma.application.update({
      where: { id: app.id },
      data: {
        stageId: toStage.id,
        position: params.position,
        ...(leavingRejection
          ? {
              rejectionReason: null,
              rejectionNote: null,
              rejectedAt: null,
              rejectedFromStageId: null,
            }
          : {}),
        events: {
          create: {
            type: leavingRejection ? "RESTORED" : "STAGE_CHANGED",
            fromStageId: app.stageId,
            toStageId: toStage.id,
            data: {
              fromStageName: app.stage.name,
              toStageName: toStage.name,
            } as Prisma.InputJsonValue,
          },
        },
      },
    });

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao mover a vaga.");
  }
}

export async function rejectApplication(params: {
  id: string;
  reason: RejectionReason;
  note?: string | null;
  rejectedAt?: string | null; // "YYYY-MM-DD"
}): Promise<ActionResult> {
  try {
    await assertSession();

    if (!REJECTION_REASONS.includes(params.reason)) {
      return { ok: false, error: "Motivo de rejeição inválido." };
    }

    const app = await prisma.application.findUnique({
      where: { id: params.id },
      include: { stage: true },
    });
    if (!app) return { ok: false, error: "Vaga não encontrada." };

    const rejectionStage = await prisma.stage.findFirst({
      where: { isRejection: true },
    });
    if (!rejectionStage)
      return { ok: false, error: "Etapa de rejeição não configurada." };

    const alreadyRejected = app.stage.isRejection;
    const note = clean(params.note);
    const rejectedAt = params.rejectedAt
      ? dateFromInput(params.rejectedAt)
      : new Date();
    const position = alreadyRejected
      ? app.position
      : await startOfColumnPosition(rejectionStage.id);

    await prisma.application.update({
      where: { id: app.id },
      data: {
        stageId: rejectionStage.id,
        position,
        rejectionReason: params.reason,
        rejectionNote: note,
        rejectedAt,
        rejectedFromStageId: alreadyRejected
          ? app.rejectedFromStageId
          : app.stageId,
        events: {
          create: {
            type: "REJECTED",
            fromStageId: app.stageId,
            toStageId: rejectionStage.id,
            data: {
              reason: params.reason,
              note,
              fromStageName: app.stage.name,
              toStageName: rejectionStage.name,
            } as Prisma.InputJsonValue,
          },
        },
      },
    });

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao registrar a rejeição.");
  }
}

export async function updateApplication(
  id: string,
  input: Partial<ApplicationInput>
): Promise<ActionResult> {
  try {
    await assertSession();

    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) return { ok: false, error: "Vaga não encontrada." };

    const data: Prisma.ApplicationUpdateInput = {};
    const changed: string[] = [];

    const setField = <T>(
      field: keyof typeof FIELD_LABELS,
      next: T,
      current: T
    ) => {
      const normalizedNext = next instanceof Date ? next.getTime() : next;
      const normalizedCurrent =
        current instanceof Date ? current.getTime() : current;
      if (normalizedNext !== normalizedCurrent) {
        (data as Record<string, unknown>)[field] = next;
        changed.push(FIELD_LABELS[field]);
      }
    };

    if (input.company !== undefined) {
      const company = clean(input.company);
      if (!company) return { ok: false, error: "Informe a empresa." };
      setField("company", company, app.company);
    }
    if (input.roleTitle !== undefined) {
      const roleTitle = clean(input.roleTitle);
      if (!roleTitle) return { ok: false, error: "Informe o cargo." };
      setField("roleTitle", roleTitle, app.roleTitle);
    }
    if (input.jobUrl !== undefined)
      setField("jobUrl", clean(input.jobUrl), app.jobUrl);
    if (input.platform !== undefined)
      setField("platform", clean(input.platform), app.platform);
    if (input.locationCity !== undefined)
      setField("locationCity", clean(input.locationCity), app.locationCity);
    if (input.salary !== undefined)
      setField("salary", clean(input.salary), app.salary);
    if (input.notes !== undefined)
      setField("notes", clean(input.notes), app.notes);
    if (input.workModel !== undefined) {
      const workModel =
        input.workModel && WORK_MODELS.includes(input.workModel)
          ? input.workModel
          : null;
      setField("workModel", workModel, app.workModel);
    }
    if (input.priority !== undefined && PRIORITIES.includes(input.priority)) {
      setField("priority", input.priority, app.priority);
    }
    if (input.appliedAt !== undefined) {
      const appliedAt = input.appliedAt ? dateFromInput(input.appliedAt) : null;
      setField("appliedAt", appliedAt, app.appliedAt);
    }
    if (input.jobDescription !== undefined)
      setField("jobDescription", clean(input.jobDescription), app.jobDescription);
    if (input.applicationUrl !== undefined)
      setField("applicationUrl", clean(input.applicationUrl), app.applicationUrl);
    if (input.nextActionNote !== undefined)
      setField("nextActionNote", clean(input.nextActionNote), app.nextActionNote);
    if (input.nextActionAt !== undefined) {
      const nextActionAt = input.nextActionAt
        ? dateFromInput(input.nextActionAt)
        : null;
      setField("nextActionAt", nextActionAt, app.nextActionAt);
    }

    if (input.countryCode !== undefined) {
      const country = parseCountry(input.countryCode);
      if (!country.ok) return country;
      setField("countryCode", country.code, app.countryCode);
    }

    if (changed.length === 0) return { ok: true };

    await prisma.application.update({
      where: { id },
      data: {
        ...data,
        events: {
          create: {
            type: "EDITED",
            data: { fields: changed } as Prisma.InputJsonValue,
          },
        },
      },
    });

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao salvar a vaga.");
  }
}

export async function addNote(
  id: string,
  text: string
): Promise<ActionResult> {
  try {
    await assertSession();
    const note = clean(text);
    if (!note) return { ok: false, error: "Escreva a nota." };

    await prisma.applicationEvent.create({
      data: {
        applicationId: id,
        type: "NOTE",
        data: { text: note } as Prisma.InputJsonValue,
      },
    });

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao adicionar a nota.");
  }
}

export async function archiveApplication(id: string): Promise<ActionResult> {
  try {
    await assertSession();
    await prisma.application.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        events: { create: { type: "ARCHIVED" } },
      },
    });
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao arquivar a vaga.");
  }
}

export async function unarchiveApplication(id: string): Promise<ActionResult> {
  try {
    await assertSession();
    const app = await prisma.application.findUnique({
      where: { id },
      select: { stageId: true },
    });
    if (!app) return { ok: false, error: "Vaga não encontrada." };

    // Reentra no topo da raia com posição nova: a antiga pode ter sido
    // reutilizada por "Ordenar por mais recentes" ou por cards criados
    // enquanto a vaga estava arquivada (as duas rotinas ignoram arquivados).
    const position = await startOfColumnPosition(app.stageId);
    await prisma.application.update({
      where: { id },
      data: {
        archivedAt: null,
        position,
        events: { create: { type: "UNARCHIVED" } },
      },
    });
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao desarquivar a vaga.");
  }
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  try {
    await assertSession();
    await prisma.application.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Erro ao excluir a vaga.");
  }
}

export async function getApplicationEvents(
  id: string
): Promise<ActionResult<EventDTO[]>> {
  try {
    await assertSession();
    const events = await prisma.applicationEvent.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: "desc" },
    });
    return {
      ok: true,
      data: events.map((event) => ({
        id: event.id,
        type: event.type as EventDTO["type"],
        fromStageId: event.fromStageId,
        toStageId: event.toStageId,
        data: (event.data ?? null) as EventDTO["data"],
        createdAt: event.createdAt,
      })),
    };
  } catch (error) {
    return fail(error, "Erro ao carregar o histórico.");
  }
}
