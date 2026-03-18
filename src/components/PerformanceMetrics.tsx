"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

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

export default function PerformanceMetrics({ positionCount }: { positionCount?: number }) {
  const [latest, setLatest] = useState<Snapshot | null>(null);
  const [firstDate, setFirstDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("Components");
  const locale = useLocale();
  const dateLocale = localeMap[locale] || "es-MX";

  useEffect(() => {
    fetch("/api/portfolio/history")
      .then((r) => r.json())
      .then((data: Snapshot[]) => {
        if (data.length > 0) {
          setLatest(data[data.length - 1]);
          setFirstDate(data[0].date);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-border rounded-xl p-6 animate-pulse">
        <div className="h-12 bg-tag-bg rounded w-32 mx-auto mb-4" />
        <div className="h-4 bg-tag-bg rounded w-48 mx-auto" />
      </div>
    );
  }

  if (!latest) return null;

  const isPositive = latest.return_pct >= 0;
  const positions = positionCount ?? Math.round(latest.total_invested / 50);
  const days = firstDate
    ? Math.ceil(
        (Date.now() - new Date(firstDate + "T00:00:00").getTime()) / 86400000
      )
    : 0;

  return (
    <div
      className={`border rounded-xl p-6 text-center ${
        isPositive
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-red-500/30 bg-red-500/5"
      }`}
    >
      {/* Big return number — the emotional hook */}
      <p className="text-xs text-text-faint uppercase tracking-wider mb-1">
        {t("return")}
      </p>
      <p
        className={`text-5xl sm:text-6xl font-extrabold font-mono ${
          isPositive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {isPositive ? "+" : ""}
        {latest.return_pct.toFixed(2)}%
      </p>

      {/* Supporting stats inline */}
      <div className="flex items-center justify-center gap-4 mt-3 text-sm text-text-muted">
        <span className="font-mono font-semibold text-foreground">
          {positions}
        </span>{" "}
        {t("positions").toLowerCase()}
        <span className="text-text-faint">·</span>
        <span>
          {t("since").toLowerCase()}{" "}
          {firstDate
            ? new Date(firstDate + "T00:00:00").toLocaleDateString(
                dateLocale,
                { day: "numeric", month: "short", year: "numeric" }
              )
            : "—"}
        </span>
        <span className="text-text-faint">·</span>
        <span>
          {days} {t("days")}
        </span>
      </div>
    </div>
  );
}
