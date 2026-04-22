"use client";

import { useMemo } from "react";

export default function EquityCurve({
  series,
}: {
  series: Array<{ t: string; roi: number }>;
}) {
  const path = useMemo(() => {
    if (series.length < 2) return null;
    const xs = series.map((_, i) => i / (series.length - 1));
    const ys = series.map((s) => s.roi);
    const min = Math.min(...ys, 0);
    const max = Math.max(...ys, 0);
    const range = max - min || 1;
    const pts = xs.map((x, i) => {
      const y = 1 - (ys[i] - min) / range;
      return `${(x * 100).toFixed(2)},${(y * 100).toFixed(2)}`;
    });
    const zeroY = 1 - (0 - min) / range;
    return { d: "M" + pts.join(" L"), zeroY: (zeroY * 100).toFixed(2), min, max };
  }, [series]);

  if (!path) {
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

  return (
    <div className="border border-border rounded-2xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-semibold">Curva de ROI (30 días)</h2>
        <span className="text-xs text-text-faint">
          min {path.min.toFixed(1)}% · max {path.max.toFixed(1)}%
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
          y1={path.zeroY}
          y2={path.zeroY}
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeDasharray="2 2"
        />
        <path
          d={path.d}
          fill="none"
          stroke="#10b981"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
