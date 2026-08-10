import { prisma } from "./db";
import { REJECTION_REASON_LABELS } from "./domain";
import { formatMonth } from "./format";
import type {
  EventWithApp,
  RejectionReason,
  Section,
  StageDTO,
} from "./types";

export interface KpiData {
  total: number;
  ativas: number;
  entrevistas: number;
  ofertas: number;
  rejeitadas: number;
  taxaResposta: number | null; // % (0-100) ou null sem base
}

export interface MonthPoint {
  key: string;
  label: string;
  nacional: number;
  internacional: number;
}

export interface FunnelPoint {
  stageId: string;
  name: string;
  color: string;
  count: number;
}

export interface ReasonPoint {
  reason: RejectionReason;
  label: string;
  count: number;
}

export interface StageTimePoint {
  stageId: string;
  name: string;
  color: string;
  avgDays: number;
}

export interface CountryPoint {
  code: string;
  total: number;
  ativas: number;
  ofertas: number;
  rejeitadas: number;
}

export interface SectionSummary {
  section: Section;
  total: number;
  entrevistas: number;
  ofertas: number;
  rejeitadas: number;
}

export interface WeeklyGoalData {
  goal: number;
  count: number;
}

export interface NextActionItem {
  id: string;
  company: string;
  roleTitle: string;
  section: Section;
  countryCode: string | null;
  note: string | null;
  date: Date;
  overdue: boolean;
}

export interface DashboardData {
  stages: StageDTO[];
  kpis: KpiData;
  porMes: MonthPoint[];
  funil: FunnelPoint[];
  motivos: ReasonPoint[];
  tempoPorEtapa: StageTimePoint[];
  porPais: CountryPoint[];
  porSecao: SectionSummary[];
  atividadeRecente: EventWithApp[];
  metaSemana: WeeklyGoalData;
  proximasAcoes: NextActionItem[];
}

const ENTER_STAGE_EVENTS = new Set([
  "CREATED",
  "STAGE_CHANGED",
  "RESTORED",
  "REJECTED",
]);

export async function getDashboardData(
  filter?: Section
): Promise<DashboardData> {
  const appWhere = filter ? { section: filter } : {};

  const [stagesRaw, apps, events, goalSetting] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: "asc" } }),
    prisma.application.findMany({ where: appWhere }),
    prisma.applicationEvent.findMany({
      where: filter ? { application: { section: filter } } : {},
      orderBy: { createdAt: "asc" },
      include: {
        application: {
          select: {
            id: true,
            company: true,
            roleTitle: true,
            section: true,
            countryCode: true,
          },
        },
      },
    }),
    prisma.setting.findUnique({ where: { key: "weeklyGoal" } }),
  ]);

  const stages = stagesRaw as StageDTO[];
  const rejectionStage = stages.find((s) => s.isRejection);
  const stageById = new Map(stages.map((s) => [s.id, s]));

  // Eventos por aplicação (cronológicos)
  const eventsByApp = new Map<string, typeof events>();
  for (const event of events) {
    const list = eventsByApp.get(event.applicationId) ?? [];
    list.push(event);
    eventsByApp.set(event.applicationId, list);
  }

  // Maior etapa (não-rejeição) alcançada por aplicação — via histórico
  const maxReached = new Map<string, number>();
  const rejectedWithReply = new Set<string>();
  for (const event of events) {
    if (!ENTER_STAGE_EVENTS.has(event.type) || !event.toStageId) continue;
    const stage = stageById.get(event.toStageId);
    if (!stage) continue;
    if (stage.isRejection) {
      const data = (event.data ?? {}) as { reason?: string };
      if (data.reason && data.reason !== "SEM_RETORNO") {
        rejectedWithReply.add(event.applicationId);
      }
      continue;
    }
    const current = maxReached.get(event.applicationId) ?? 0;
    if (stage.order > current) maxReached.set(event.applicationId, stage.order);
  }

  const nonRejectionStages = stages.filter((s) => !s.isRejection);
  const aplicadoOrder =
    nonRejectionStages.find((s) => s.key === "aplicado")?.order ?? 2;
  const contatoOrder = aplicadoOrder + 1;
  const entrevistaOrder =
    nonRejectionStages.find((s) => s.key === "entrevista")?.order ?? 4;
  const ofertaOrder =
    nonRejectionStages.find((s) => s.key === "oferta")?.order ?? 6;

  // ── KPIs ────────────────────────────────────────────────────────────
  const total = apps.length;
  const rejeitadas = rejectionStage
    ? apps.filter((a) => a.stageId === rejectionStage.id).length
    : 0;
  const ativas = apps.filter(
    (a) => !a.archivedAt && a.stageId !== rejectionStage?.id
  ).length;
  const entrevistas = apps.filter(
    (a) => (maxReached.get(a.id) ?? 0) >= entrevistaOrder
  ).length;
  const ofertas = apps.filter(
    (a) => (maxReached.get(a.id) ?? 0) >= ofertaOrder
  ).length;

  const baseResposta = apps.filter(
    (a) => (maxReached.get(a.id) ?? 0) >= aplicadoOrder
  );
  const responderam = baseResposta.filter(
    (a) =>
      (maxReached.get(a.id) ?? 0) >= contatoOrder || rejectedWithReply.has(a.id)
  );
  const taxaResposta =
    baseResposta.length > 0
      ? Math.round((responderam.length / baseResposta.length) * 100)
      : null;

  // ── Aplicações por mês (últimos 6 meses) ───────────────────────────
  const months: MonthPoint[] = [];
  const monthIndex = new Map<string, MonthPoint>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const point: MonthPoint = {
      key,
      label: formatMonth(d),
      nacional: 0,
      internacional: 0,
    };
    months.push(point);
    monthIndex.set(key, point);
  }
  for (const app of apps) {
    const date = app.appliedAt ?? app.createdAt;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const point = monthIndex.get(key);
    if (!point) continue;
    if (app.section === "NACIONAL") point.nacional += 1;
    else point.internacional += 1;
  }

  // ── Funil: quantas aplicações chegaram a cada etapa ─────────────────
  const funil: FunnelPoint[] = nonRejectionStages.map((stage) => ({
    stageId: stage.id,
    name: stage.name,
    color: stage.color,
    count: apps.filter((a) => (maxReached.get(a.id) ?? 0) >= stage.order)
      .length,
  }));

  // ── Motivos de rejeição (estado atual das vagas) ────────────────────
  const reasonCounts = new Map<RejectionReason, number>();
  for (const app of apps) {
    if (!app.rejectionReason) continue;
    const reason = app.rejectionReason as RejectionReason;
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }
  const motivos: ReasonPoint[] = [...reasonCounts.entries()]
    .map(([reason, count]) => ({
      reason,
      label: REJECTION_REASON_LABELS[reason],
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Tempo médio por etapa (dias) — intervalos entre eventos ────────
  const stageDurations = new Map<string, { totalDays: number; samples: number }>();
  for (const app of apps) {
    const appEvents = (eventsByApp.get(app.id) ?? []).filter(
      (e) => ENTER_STAGE_EVENTS.has(e.type) && e.toStageId
    );
    for (let i = 0; i < appEvents.length; i++) {
      const entry = appEvents[i];
      const stage = stageById.get(entry.toStageId as string);
      if (!stage || stage.isRejection) continue;
      const start = entry.createdAt.getTime();
      const end =
        i + 1 < appEvents.length
          ? appEvents[i + 1].createdAt.getTime()
          : app.archivedAt
            ? app.archivedAt.getTime()
            : Date.now();
      const days = Math.max(0, (end - start) / 86_400_000);
      const bucket = stageDurations.get(stage.id) ?? {
        totalDays: 0,
        samples: 0,
      };
      bucket.totalDays += days;
      bucket.samples += 1;
      stageDurations.set(stage.id, bucket);
    }
  }
  const tempoPorEtapa: StageTimePoint[] = nonRejectionStages.map((stage) => {
    const bucket = stageDurations.get(stage.id);
    return {
      stageId: stage.id,
      name: stage.name,
      color: stage.color,
      avgDays: bucket ? Math.round((bucket.totalDays / bucket.samples) * 10) / 10 : 0,
    };
  });

  // ── Por país (somente internacionais) ───────────────────────────────
  const countryMap = new Map<string, CountryPoint>();
  for (const app of apps) {
    if (app.section !== "INTERNACIONAL" || !app.countryCode) continue;
    const point = countryMap.get(app.countryCode) ?? {
      code: app.countryCode,
      total: 0,
      ativas: 0,
      ofertas: 0,
      rejeitadas: 0,
    };
    point.total += 1;
    if (!app.archivedAt && app.stageId !== rejectionStage?.id)
      point.ativas += 1;
    if ((maxReached.get(app.id) ?? 0) >= ofertaOrder) point.ofertas += 1;
    if (app.stageId === rejectionStage?.id) point.rejeitadas += 1;
    countryMap.set(app.countryCode, point);
  }
  const porPais = [...countryMap.values()].sort((a, b) => b.total - a.total);

  // ── Comparativo por seção ───────────────────────────────────────────
  const porSecao: SectionSummary[] = (
    ["NACIONAL", "INTERNACIONAL"] as Section[]
  ).map((section) => {
    const sectionApps = apps.filter((a) => a.section === section);
    return {
      section,
      total: sectionApps.length,
      entrevistas: sectionApps.filter(
        (a) => (maxReached.get(a.id) ?? 0) >= entrevistaOrder
      ).length,
      ofertas: sectionApps.filter(
        (a) => (maxReached.get(a.id) ?? 0) >= ofertaOrder
      ).length,
      rejeitadas: sectionApps.filter((a) => a.stageId === rejectionStage?.id)
        .length,
    };
  });

  // ── Meta semanal (segunda a domingo) ────────────────────────────────
  const goal = Math.max(1, parseInt(goalSetting?.value ?? "10", 10) || 10);
  const today = new Date();
  const weekday = (today.getDay() + 6) % 7; // 0 = segunda
  const weekStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - weekday
  );
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const weekCount = apps.filter((app) => {
    const date = app.appliedAt ?? app.createdAt;
    return date >= weekStart && date < weekEnd;
  }).length;

  // ── Próximas ações (vagas ativas com data marcada) ─────────────────
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const proximasAcoes: NextActionItem[] = apps
    .filter(
      (app) =>
        app.nextActionAt &&
        !app.archivedAt &&
        app.stageId !== rejectionStage?.id
    )
    .map((app) => ({
      id: app.id,
      company: app.company,
      roleTitle: app.roleTitle,
      section: app.section as Section,
      countryCode: app.countryCode,
      note: app.nextActionNote,
      date: app.nextActionAt as Date,
      overdue: (app.nextActionAt as Date) < todayStart,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10);

  // ── Atividade recente ───────────────────────────────────────────────
  const atividadeRecente: EventWithApp[] = events
    .slice(-12)
    .reverse()
    .map((event) => ({
      id: event.id,
      type: event.type as EventWithApp["type"],
      fromStageId: event.fromStageId,
      toStageId: event.toStageId,
      data: (event.data ?? null) as EventWithApp["data"],
      createdAt: event.createdAt,
      application: {
        id: event.application.id,
        company: event.application.company,
        roleTitle: event.application.roleTitle,
        section: event.application.section as Section,
        countryCode: event.application.countryCode,
      },
    }));

  return {
    stages,
    kpis: { total, ativas, entrevistas, ofertas, rejeitadas, taxaResposta },
    porMes: months,
    funil,
    motivos,
    tempoPorEtapa,
    porPais,
    porSecao,
    atividadeRecente,
    metaSemana: { goal, count: weekCount },
    proximasAcoes,
  };
}
