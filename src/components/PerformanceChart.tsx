"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface Snapshot {
  date: string;
  total_invested: number;
  total_value: number;
  return_pct: number;
}

const localeMap: Record<string, string> = {
  es: "es-MX",
  en: "en-US",
  pt: "pt-BR",
  hi: "hi-IN",
};

export default function PerformanceChart() {
  const [data, setData] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("Components");
  const locale = useLocale();
  const dateLocale = localeMap[locale] || "es-MX";

  useEffect(() => {
    fetch("/api/portfolio/history")
      .then((r) => r.json())
      .then((snapshots: Snapshot[]) => {
        setData(snapshots);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-border rounded-xl p-6 h-80 animate-pulse" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t("performanceTitle")}
        </h3>
        <p className="text-sm text-text-faint">
          {t("noDataYet")}
        </p>
      </div>
    );
  }

  const chartData = data.map((s) => ({
    date: new Date(s.date + "T00:00:00").toLocaleDateString(dateLocale, {
      month: "short",
      day: "numeric",
    }),
    return_pct: Number(s.return_pct),
    value: Number(s.total_value),
  }));

  const latestReturn = chartData[chartData.length - 1]?.return_pct ?? 0;
  const lineColor = latestReturn >= 0 ? "#34d399" : "#f87171";

  return (
    <div className="border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {t("performanceTitle")}
        </h3>
        <span
          className={`text-sm font-mono font-bold ${
            latestReturn >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {latestReturn >= 0 ? "+" : ""}
          {latestReturn.toFixed(2)}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--tick-fill)", fontSize: 12 }}
            axisLine={{ stroke: "var(--axis-stroke)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--tick-fill)", fontSize: 12 }}
            axisLine={{ stroke: "var(--axis-stroke)" }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tooltip-bg)",
              border: "1px solid var(--tooltip-border)",
              borderRadius: "8px",
              color: "var(--foreground)",
              fontSize: "13px",
            }}
            formatter={(value) => {
              const v = Number(value);
              return [`${v >= 0 ? "+" : ""}${v.toFixed(2)}%`, t("returnLabel")];
            }}
          />
          <ReferenceLine y={0} stroke="var(--border-secondary)" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="return_pct"
            stroke={lineColor}
            strokeWidth={2}
            dot={data.length <= 30}
            activeDot={{ r: 5, fill: lineColor }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
