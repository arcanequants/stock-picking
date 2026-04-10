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
  spy_return_pct?: number | null;
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
    spy_return_pct: s.spy_return_pct != null ? Number(s.spy_return_pct) : null,
    value: Number(s.total_value),
  }));

  const latestReturn = chartData[chartData.length - 1]?.return_pct ?? 0;
  const latestSpy = chartData[chartData.length - 1]?.spy_return_pct ?? null;
  const lineColor = latestReturn >= 0 ? "#34d399" : "#f87171";
  const spyColor = "#9ca3af"; // neutral grey
  const hasSpyData = chartData.some((d) => d.spy_return_pct != null);
  const beatingSpy =
    hasSpyData && latestSpy != null && latestReturn > latestSpy;
  const diffVsSpy =
    hasSpyData && latestSpy != null ? latestReturn - latestSpy : 0;

  const fmt = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

  return (
    <div className="border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {t("performanceTitle")}
        </h3>

        {/* Comparative pill — always visible */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5 rounded-full"
              style={{ backgroundColor: lineColor }}
            />
            <span className="text-text-muted">{t("vectorialLabel")}</span>
            <span
              className={`font-bold ${
                latestReturn >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {fmt(latestReturn)}
            </span>
          </span>
          {hasSpyData && latestSpy != null && (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-0 border-t-2 border-dashed"
                style={{ borderColor: spyColor }}
              />
              <span className="text-text-muted">{t("spyLabel")}</span>
              <span className="font-bold text-text-muted">
                {fmt(latestSpy)}
              </span>
            </span>
          )}
        </div>
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
            formatter={(value, name) => {
              const v = Number(value);
              const label =
                name === "spy_return_pct"
                  ? t("spyLabel")
                  : t("vectorialLabel");
              return [fmt(v), label];
            }}
          />
          <ReferenceLine y={0} stroke="var(--border-secondary)" strokeDasharray="3 3" />
          {/* SPY benchmark line — grey, dashed, secondary */}
          {hasSpyData && (
            <Line
              type="monotone"
              dataKey="spy_return_pct"
              stroke={spyColor}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 4, fill: spyColor }}
              connectNulls
            />
          )}
          {/* Vectorial portfolio line — primary */}
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

      {/* Micro-copy: only when beating SPY — honest silence otherwise */}
      {beatingSpy && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 font-medium">
          {t("beatingSpyText", { diff: diffVsSpy.toFixed(2) })}
        </p>
      )}

      {/* Benchmark disclosure — builds trust */}
      {hasSpyData && (
        <p className="text-[11px] text-text-faint mt-2 leading-relaxed">
          {t("benchmarkNote")}
        </p>
      )}
    </div>
  );
}
