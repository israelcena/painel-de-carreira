"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_SERIES_COLOR } from "@/lib/domain";
import type { MonthPoint } from "@/lib/metrics";

const AXIS_TICK = { fill: "#8a92b2", fontSize: 11, fontWeight: 700 };

// Rótulo visível apenas para valores > 0 (regra de alívio do contraste)
const labelFormatter = (value: unknown) =>
  typeof value === "number" && value > 0 ? String(value) : "";

/** Aplicações por mês — série única (o recorte geográfico fica na tabela por país). */
export function MonthlyChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className="h-56 w-full 2xl:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e6eaf7" />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            axisLine={{ stroke: "#dde3f5" }}
            tickLine={false}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(111, 123, 240, 0.08)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #dde3f5",
              boxShadow: "0 6px 18px rgba(80,95,160,0.15)",
              fontSize: 12,
              fontWeight: 700,
              color: "#3d4468",
            }}
          />
          <Bar
            dataKey="total"
            name="Aplicações"
            fill={CHART_SERIES_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          >
            <LabelList
              dataKey="total"
              position="top"
              formatter={labelFormatter}
              style={{ fill: "#5a6284", fontSize: 10, fontWeight: 800 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
