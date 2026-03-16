"use client";

import { useEffect, useState } from "react";

interface Snapshot {
  date: string;
  total_invested: number;
  total_value: number;
  return_pct: number;
}

export default function HeroMetrics() {
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

  if (returnPct === null) return null;

  const isPositive = returnPct >= 0;

  return (
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
      Portfolio: {isPositive ? "+" : ""}{returnPct.toFixed(2)}%
    </div>
  );
}
