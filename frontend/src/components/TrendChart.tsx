"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CRITICAL_THRESHOLD } from "@/lib/health";
import type { HealthPoint } from "@/lib/types";

export function TrendChart({ history }: { history: HealthPoint[] }) {
  const data = history
    .slice()
    .sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    )
    .map((h) => ({
      date: new Date(h.recordedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      shi: Math.round(h.shi),
    }));

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No health history yet.</p>;
  }

  const margin = { top: 8, right: 12, left: -12, bottom: 0 };
  const axisTick = { fontSize: 11 };
  const criticalLabel = {
    value: "Critical",
    fontSize: 10,
    fill: "#f97316",
    position: "insideTopRight" as const,
  };

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={margin}>
          <defs>
            <linearGradient id="shiFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="date" tick={axisTick} minTickGap={24} />
          <YAxis domain={[0, 100]} tick={axisTick} width={32} />
          <Tooltip />
          <ReferenceLine
            y={CRITICAL_THRESHOLD}
            stroke="#f97316"
            strokeDasharray="4 4"
            label={criticalLabel}
          />
          <Area
            type="monotone"
            dataKey="shi"
            stroke="#2563eb"
            fill="url(#shiFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
