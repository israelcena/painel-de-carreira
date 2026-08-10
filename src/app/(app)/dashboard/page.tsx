import {
  Activity,
  Award,
  BriefcaseBusiness,
  ThumbsDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BarList } from "@/components/dashboard/BarList";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { Flag } from "@/components/ui/Flag";
import { countryName } from "@/lib/countries";
import { SECTION_COLORS, SECTION_LABELS } from "@/lib/domain";
import { describeEvent, EVENT_COLORS } from "@/lib/events";
import { formatDateTime, relativeTime } from "@/lib/format";
import { getDashboardData } from "@/lib/metrics";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-card ${className}`}>
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-ink-soft">
        {title}
      </h2>
      {children}
    </section>
  );
}

const KPI_ICONS = {
  total: BriefcaseBusiness,
  ativas: Activity,
  entrevistas: Users,
  ofertas: Award,
  rejeitadas: ThumbsDown,
  taxa: TrendingUp,
} as const;

function KpiTile({
  icon,
  value,
  label,
  accent,
}: {
  icon: keyof typeof KPI_ICONS;
  value: string;
  label: string;
  accent: string;
}) {
  const Icon = KPI_ICONS[icon];
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-card 2xl:p-4">
      <div
        className="mb-2 grid size-8 place-items-center rounded-xl"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        <Icon size={16} strokeWidth={2.4} />
      </div>
      <p className="text-2xl font-extrabold leading-none text-ink 2xl:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
    </div>
  );
}

const FILTERS: { value: Section | ""; label: string }[] = [
  { value: "", label: "Tudo" },
  { value: "NACIONAL", label: "Nacional" },
  { value: "INTERNACIONAL", label: "Internacional" },
];

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const params = await searchParams;
  const secaoParam =
    typeof params.secao === "string" ? params.secao.toUpperCase() : "";
  const filter: Section | undefined =
    secaoParam === "NACIONAL" || secaoParam === "INTERNACIONAL"
      ? (secaoParam as Section)
      : undefined;

  const data = await getDashboardData(filter);
  const { kpis } = data;

  return (
    <div className="mx-auto max-w-[1800px] space-y-4 px-3 py-4 md:space-y-5 md:px-6 md:py-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-extrabold tracking-tight text-ink md:text-xl">
          Dashboard
        </h1>
        <nav className="flex rounded-full bg-white/70 p-1 shadow-card">
          {FILTERS.map((f) => {
            const active = (filter ?? "") === f.value;
            return (
              <Link
                key={f.label}
                href={f.value ? `/dashboard?secao=${f.value.toLowerCase()}` : "/dashboard"}
                className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition md:px-4 md:text-sm ${
                  active
                    ? "bg-gradient-to-r from-brand-violet to-brand-blue text-white shadow-card"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiTile icon="total" value={String(kpis.total)} label="Aplicações" accent="#6a5cd8" />
        <KpiTile icon="ativas" value={String(kpis.ativas)} label="Ativas" accent="#57a5f5" />
        <KpiTile icon="entrevistas" value={String(kpis.entrevistas)} label="Entrevistas" accent="#f59e0b" />
        <KpiTile icon="ofertas" value={String(kpis.ofertas)} label="Ofertas" accent="#10b981" />
        <KpiTile icon="rejeitadas" value={String(kpis.rejeitadas)} label="Rejeitadas" accent="#ef4444" />
        <KpiTile
          icon="taxa"
          value={kpis.taxaResposta === null ? "—" : `${kpis.taxaResposta}%`}
          label="Taxa de resposta"
          accent="#06b6d4"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <Card title="Aplicações por mês">
          <MonthlyChart data={data.porMes} />
        </Card>

        <Card title="Funil de conversão">
          <BarList
            items={data.funil.map((f) => ({
              key: f.stageId,
              label: f.name,
              value: f.count,
              color: f.color,
            }))}
          />
          <p className="mt-3 text-[11px] font-semibold text-muted">
            Quantas aplicações chegaram a cada etapa, com base no histórico.
          </p>
        </Card>

        <Card title="Motivos de rejeição">
          <BarList
            items={data.motivos.map((m) => ({
              key: m.reason,
              label: m.label,
              value: m.count,
              color: "#e34948",
            }))}
          />
        </Card>

        <Card title="Tempo médio por etapa">
          <BarList
            items={data.tempoPorEtapa.map((t) => ({
              key: t.stageId,
              label: t.name,
              value: t.avgDays,
              color: t.color,
              suffix: "d",
            }))}
          />
          <p className="mt-3 text-[11px] font-semibold text-muted">
            Média de dias que as vagas passam em cada etapa.
          </p>
        </Card>

        {!filter && (
          <Card title="Nacional × Internacional">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="pb-2">Seção</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2 text-right">Entrevistas</th>
                  <th className="pb-2 text-right">Ofertas</th>
                  <th className="pb-2 text-right">Rejeições</th>
                </tr>
              </thead>
              <tbody>
                {data.porSecao.map((row) => (
                  <tr key={row.section} className="border-t border-line">
                    <td className="flex items-center gap-2 py-2.5 font-extrabold text-ink">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: SECTION_COLORS[row.section] }}
                      />
                      {SECTION_LABELS[row.section]}
                    </td>
                    <td className="py-2.5 text-right font-bold text-ink-soft">{row.total}</td>
                    <td className="py-2.5 text-right font-bold text-ink-soft">{row.entrevistas}</td>
                    <td className="py-2.5 text-right font-bold text-ink-soft">{row.ofertas}</td>
                    <td className="py-2.5 text-right font-bold text-ink-soft">{row.rejeitadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Card title="Por país (internacional)">
          {data.porPais.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-muted">
              Nenhuma vaga internacional ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                    <th className="pb-2">País</th>
                    <th className="pb-2 text-right">Total</th>
                    <th className="pb-2 text-right">Ativas</th>
                    <th className="pb-2 text-right">Ofertas</th>
                    <th className="pb-2 text-right">Rejeições</th>
                  </tr>
                </thead>
                <tbody>
                  {data.porPais.map((row) => (
                    <tr key={row.code} className="border-t border-line">
                      <td className="flex items-center gap-2 py-2.5 font-extrabold text-ink">
                        <Flag code={row.code} className="h-3.5 w-[1.3125rem] rounded-[2px] shadow-sm" />
                        {countryName(row.code)}
                      </td>
                      <td className="py-2.5 text-right font-bold text-ink-soft">{row.total}</td>
                      <td className="py-2.5 text-right font-bold text-ink-soft">{row.ativas}</td>
                      <td className="py-2.5 text-right font-bold text-ink-soft">{row.ofertas}</td>
                      <td className="py-2.5 text-right font-bold text-ink-soft">{row.rejeitadas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Atividade recente" className="lg:col-span-2 2xl:col-span-3">
          {data.atividadeRecente.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-muted">
              Nenhuma atividade ainda — crie sua primeira vaga no quadro.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {data.atividadeRecente.map((event) => {
                const stageNameById = Object.fromEntries(
                  data.stages.map((s) => [s.id, s.name])
                );
                return (
                  <li key={event.id} className="flex items-start gap-3 py-2.5">
                    <span
                      className="mt-1.5 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: EVENT_COLORS[event.type] ?? "#8a92b2" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">
                        <span className="font-extrabold">
                          {event.application.company}
                        </span>{" "}
                        <span className="text-ink-soft">
                          — {event.application.roleTitle}
                        </span>
                        {event.application.countryCode && (
                          <Flag
                            code={event.application.countryCode}
                            className="ml-1.5 inline h-3 w-[1.125rem] rounded-[2px] align-baseline"
                          />
                        )}
                      </p>
                      <p className="truncate text-xs font-semibold text-ink-soft">
                        {describeEvent(event, stageNameById)}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[11px] font-bold text-muted"
                      title={formatDateTime(event.createdAt)}
                    >
                      {relativeTime(event.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
