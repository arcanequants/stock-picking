"use client";

import { useMemo } from "react";

interface Point {
  t: string;
  roi: number;
}

export default function EquityCurve({
  series,
  benchmark,
}: {
  series: Point[];
  benchmark?: { symbol: string; label: string; series: Point[] } | null;
}) {
  const view = useMemo(() => {
    if (series.length < 2) return null;

    const startMs = new Date(series[0].t).getTime();
    const endMs = new Date(series[series.length - 1].t).getTime();
    const span = Math.max(1, endMs - startMs);
    const xOf = (t: string) =>
      Math.max(0, Math.min(1, (new Date(t).getTime() - startMs) / span));

    const benchSeries = benchmark?.series ?? [];

    const allYs = [
      ...series.map((s) => s.roi),
      ...benchSeries.map((s) => s.roi),
      0,
    ];
    const min = Math.min(...allYs);
    const max = Math.max(...allYs);
    const range = max - min || 1;

    const toPath = (pts: Point[]) =>
      "M" +
      pts
        .map((p) => {
          const x = xOf(p.t) * 100;
          const y = (1 - (p.roi - min) / range) * 100;
          return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" L");

    const zeroY = ((1 - (0 - min) / range) * 100).toFixed(2);
    const botEnd = series[series.length - 1].roi;
    const benchEnd =
      benchSeries.length > 0 ? benchSeries[benchSeries.length - 1].roi : null;

    return {
      botPath: toPath(series),
      benchPath: benchSeries.length > 1 ? toPath(benchSeries) : null,
      zeroY,
      min,
      max,
      botEnd,
      benchEnd,
    };
  }, [series, benchmark]);

  if (!view) {
    return (
      <div className="border border-border rounded-2xl p-6 h-56 flex items-center justify-center text-center">
        <div>
          <p className="text-sm text-text-muted">
            Construyendo curva — se necesitan al menos 2 snapshots.
          </p>
          <p className="text-xs text-text-faint mt-1">
            El gráfico se rellena automáticamente cada 2 horas.
          </p>
        </div>
      </div>
    );
  }

  const fmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
  const benchLabel = benchmark?.label ?? null;

  return (
    <div className="border border-border rounded-2xl p-5">
      <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
        <h2 className="font-semibold">Curva de ROI (30 días)</h2>
        <span className="text-xs text-text-faint">
          min {view.min.toFixed(1)}% · max {view.max.toFixed(1)}%
        </span>
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-48 block"
      >
        <line
          x1="0"
          x2="100"
          y1={view.zeroY}
          y2={view.zeroY}
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeDasharray="2 2"
        />
        {view.benchPath && (
          <path
            d={view.benchPath}
            fill="none"
            stroke="#94a3b8"
            strokeOpacity="0.7"
            strokeWidth="0.6"
            strokeDasharray="1.6 1.6"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path
          d={view.botPath}
          fill="none"
          stroke="#10b981"
          strokeWidth="0.9"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex items-center gap-5 mt-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-0.5 bg-emerald-500"
            aria-hidden
          />
          <span className="text-text-muted">
            Bot{" "}
            <span className="text-emerald-500 font-medium">
              {fmt(view.botEnd)}
            </span>
          </span>
        </span>
        {benchLabel && view.benchEnd != null && (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 border-t border-dashed border-slate-400"
              aria-hidden
            />
            <span className="text-text-muted">
              {benchLabel}{" "}
              <span className="text-text-secondary font-medium">
                {fmt(view.benchEnd)}
              </span>
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
