"use client";

import { useEffect, useState } from "react";

interface Snapshot {
  date: string;
  total_invested: number;
  total_value: number;
  return_pct: number;
}

export default function HeroMetrics({ avgDivYield }: { avgDivYield: number }) {
  const [returnPct, setReturnPct] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/portfolio/history")
      .then((r) => r.json())
      .then((data: Snapshot[]) => {
        if (data.length > 0) {
          setReturnPct(data[data.length - 1].return_pct);
        }
      })
      .catch(() => {});
  }, []);

  const isPositive = returnPct !== null && returnPct >= 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {/* Return badge */}
      {returnPct !== null && (
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono font-bold ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPositive ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPositive ? "bg-emerald-500" : "bg-red-500"}`} />
          </span>
          Portafolio: {isPositive ? "+" : ""}{returnPct.toFixed(2)}%
        </div>
      )}

      {/* Dividend yield badge */}
      {avgDivYield > 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Dividendos: {avgDivYield.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
