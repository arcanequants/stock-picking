"use client";

import { useEffect, useState } from "react";

interface Snapshot {
  date: string;
  total_invested: number;
  total_value: number;
  return_pct: number;
}

export default function PerformanceMetrics() {
  const [latest, setLatest] = useState<Snapshot | null>(null);
  const [firstDate, setFirstDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-zinc-800 rounded-xl p-4 h-24" />
        ))}
      </div>
    );
  }

  if (!latest) return null;

  const gain = latest.total_value - latest.total_invested;
  const isPositive = gain >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">
          Total Invested
        </p>
        <p className="text-2xl font-bold font-mono text-white mt-1">
          ${latest.total_invested.toFixed(2)}
        </p>
      </div>

      <div className="border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">
          Current Value
        </p>
        <p className="text-2xl font-bold font-mono text-white mt-1">
          ${latest.total_value.toFixed(2)}
        </p>
      </div>

      <div
        className={`border rounded-xl p-4 ${
          isPositive
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}
      >
        <p className="text-xs text-zinc-500 uppercase tracking-wider">
          Return
        </p>
        <p
          className={`text-2xl font-bold font-mono mt-1 ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {latest.return_pct.toFixed(2)}%
        </p>
        <p
          className={`text-xs font-mono mt-0.5 ${
            isPositive ? "text-emerald-400/70" : "text-red-400/70"
          }`}
        >
          {isPositive ? "+$" : "-$"}
          {Math.abs(gain).toFixed(2)}
        </p>
      </div>

      <div className="border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">
          Investment to Date
        </p>
        <p className="text-lg font-bold text-white mt-1">
          {firstDate
            ? new Date(firstDate + "T00:00:00").toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {latest ? `${Math.ceil((Date.now() - new Date(firstDate + "T00:00:00").getTime()) / 86400000)} days` : ""}
        </p>
      </div>
    </div>
  );
}
