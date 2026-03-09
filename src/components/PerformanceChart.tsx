"use client";

import { useEffect, useState } from "react";
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

export default function PerformanceChart() {
  const [data, setData] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="border border-zinc-800 rounded-xl p-6 h-80 animate-pulse" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Portfolio Performance
        </h3>
        <p className="text-sm text-zinc-500">
          No performance data yet. Data will appear after the first daily
          snapshot.
        </p>
      </div>
    );
  }

  const chartData = data.map((s) => ({
    date: new Date(s.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    return_pct: Number(s.return_pct),
    value: Number(s.total_value),
  }));

  const latestReturn = chartData[chartData.length - 1]?.return_pct ?? 0;
  const lineColor = latestReturn >= 0 ? "#34d399" : "#f87171";

  return (
    <div className="border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Portfolio Performance
        </h3>
        <span
          className={`text-sm font-mono font-bold ${
            latestReturn >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {latestReturn >= 0 ? "+" : ""}
          {latestReturn.toFixed(2)}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#71717a", fontSize: 12 }}
            axisLine={{ stroke: "#27272a" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 12 }}
            axisLine={{ stroke: "#27272a" }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#fafafa",
              fontSize: "13px",
            }}
            formatter={(value) => {
              const v = Number(value);
              return [`${v >= 0 ? "+" : ""}${v.toFixed(2)}%`, "Return"];
            }}
          />
          <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="3 3" />
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
