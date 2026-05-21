"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SignalObservation } from "@/lib/signals";

type Timeframe = "1M" | "3M" | "YTD" | "1Y" | "2Y" | "ALL";

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "1M", label: "1M" },
  { id: "3M", label: "3M" },
  { id: "YTD", label: "YTD" },
  { id: "1Y", label: "1Y" },
  { id: "2Y", label: "2Y" },
  { id: "ALL", label: "ALL" },
];

function startCutoff(tf: Timeframe): number {
  const now = Date.now();
  const day = 86400_000;
  switch (tf) {
    case "1M":
      return now - 30 * day;
    case "3M":
      return now - 90 * day;
    case "YTD": {
      const y = new Date();
      y.setUTCMonth(0, 1);
      y.setUTCHours(0, 0, 0, 0);
      return y.getTime();
    }
    case "1Y":
      return now - 365 * day;
    case "2Y":
      return now - 730 * day;
    case "ALL":
      return 0;
  }
}

function fmtDate(ts: number, range: number): string {
  const d = new Date(ts);
  if (range > 400 * 86400_000) {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtFullDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtValue(v: number, decimals: number): string {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function SignalChart({
  history,
  unit,
  decimals,
  baselineLabel,
  height = 220,
  initial = "3M",
}: {
  history: SignalObservation[];
  unit: string;
  decimals: number;
  baselineLabel: string;
  height?: number;
  initial?: Timeframe;
}) {
  const [tf, setTf] = useState<Timeframe>(initial);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Coerce + cache numerics with epoch timestamps once.
  const all = useMemo(
    () =>
      history.map((h) => ({
        t: new Date(h.observed_at).getTime(),
        v: Number(h.value),
        b: h.baseline_value != null ? Number(h.baseline_value) : null,
      })),
    [history]
  );

  const points = useMemo(() => {
    const cutoff = startCutoff(tf);
    return all.filter((p) => p.t >= cutoff);
  }, [all, tf]);

  // Available timeframes: only show if there's >=2 points in that window.
  const available = useMemo(() => {
    return TIMEFRAMES.filter((t) => {
      const cutoff = startCutoff(t.id);
      return all.filter((p) => p.t >= cutoff).length >= 2;
    });
  }, [all]);

  // Reset hover when timeframe changes.
  useEffect(() => {
    setHoverIdx(null);
  }, [tf]);

  // Geometry. Use a fixed viewBox; CSS stretches the SVG.
  const W = 760;
  const H = height;
  const PAD_L = 48;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const tDomain = useMemo(() => {
    if (points.length === 0) return [0, 1] as const;
    const tMin = points[0].t;
    const tMax = points[points.length - 1].t;
    return [tMin, tMax === tMin ? tMin + 1 : tMax] as const;
  }, [points]);

  const vDomain = useMemo(() => {
    if (points.length === 0) return [0, 1] as const;
    const vs = points.map((p) => p.v);
    const bs = points.map((p) => p.b).filter((b): b is number => b != null);
    const min = Math.min(...vs, ...bs);
    const max = Math.max(...vs, ...bs);
    const range = max - min || Math.abs(max) || 1;
    const pad = range * 0.1;
    return [min - pad, max + pad] as const;
  }, [points]);

  const xFor = useCallback(
    (t: number) =>
      PAD_L + ((t - tDomain[0]) / (tDomain[1] - tDomain[0])) * innerW,
    [tDomain, innerW]
  );
  const yFor = useCallback(
    (v: number) =>
      PAD_T + innerH - ((v - vDomain[0]) / (vDomain[1] - vDomain[0])) * innerH,
    [vDomain, innerH]
  );

  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.t)} ${yFor(p.v)}`)
      .join(" ");
  }, [points, xFor, yFor]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const top = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.t)} ${yFor(p.v)}`)
      .join(" ");
    const baseY = PAD_T + innerH;
    const last = points[points.length - 1];
    const first = points[0];
    return `${top} L ${xFor(last.t)} ${baseY} L ${xFor(first.t)} ${baseY} Z`;
  }, [points, xFor, yFor, innerH]);

  const baselinePath = useMemo(() => {
    const withB = points.filter((p) => p.b != null) as {
      t: number;
      v: number;
      b: number;
    }[];
    if (withB.length < 2) return null;
    return withB
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.t)} ${yFor(p.b)}`)
      .join(" ");
  }, [points, xFor, yFor]);

  // Y-axis ticks: 4 ticks min..max.
  const yTicks = useMemo(() => {
    const [a, b] = vDomain;
    const n = 4;
    return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
  }, [vDomain]);

  // X-axis ticks: ~5 evenly spaced.
  const xTicks = useMemo(() => {
    const [a, b] = tDomain;
    const n = 5;
    return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
  }, [tDomain]);

  const range = tDomain[1] - tDomain[0];

  const onMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (points.length === 0) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const xPx = ((e.clientX - rect.left) / rect.width) * W;
      // Find nearest point by x.
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < points.length; i++) {
        const d = Math.abs(xFor(points[i].t) - xPx);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      setHoverIdx(best);
    },
    [points, xFor]
  );

  const onMouseLeave = useCallback(() => setHoverIdx(null), []);

  // Touch handling for mobile.
  const onTouchMove = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (points.length === 0) return;
      const touch = e.touches[0];
      if (!touch) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const xPx = ((touch.clientX - rect.left) / rect.width) * W;
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < points.length; i++) {
        const d = Math.abs(xFor(points[i].t) - xPx);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      setHoverIdx(best);
    },
    [points, xFor]
  );

  const hover = hoverIdx != null ? points[hoverIdx] : null;
  const last = points[points.length - 1];
  const first = points[0];
  const trendUp = first && last ? last.v >= first.v : true;
  const tfChangePct =
    first && last && first.v !== 0
      ? ((last.v - first.v) / Math.abs(first.v)) * 100
      : null;

  if (points.length < 2) {
    return (
      <div className="text-xs text-text-faint italic">
        Not enough history yet — chart will appear once 2+ observations exist.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Toolbar — timeframe selector + range delta */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-lg border border-border bg-card/40 p-0.5 text-[11px] font-mono">
          {available.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTf(t.id)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                tf === t.id
                  ? "bg-signals-accent/15 text-signals-accent-text"
                  : "text-text-faint hover:text-text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-faint tabular-nums">
          {tfChangePct !== null && (
            <span
              className={
                trendUp
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }
            >
              {trendUp ? "▲" : "▼"} {tfChangePct >= 0 ? "+" : ""}
              {tfChangePct.toFixed(2)}% in window
            </span>
          )}
          <span>n={points.length}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none touch-none"
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseLeave}
          role="img"
          aria-label={`Interactive chart with ${points.length} observations`}
        >
          <defs>
            <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y grid lines + labels */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={yFor(v)}
                y2={yFor(v)}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeDasharray={i === 0 || i === yTicks.length - 1 ? undefined : "2 4"}
                className="text-text-faint"
              />
              <text
                x={PAD_L - 6}
                y={yFor(v) + 3}
                textAnchor="end"
                fontSize="10"
                className="fill-current text-text-faint tabular-nums"
                fontFamily="monospace"
              >
                {fmtValue(v, decimals)}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {xTicks.map((t, i) => (
            <text
              key={i}
              x={xFor(t)}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              className="fill-current text-text-faint"
              fontFamily="monospace"
            >
              {fmtDate(t, range)}
            </text>
          ))}

          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#chart-fill)"
            className={
              trendUp
                ? "text-emerald-500 dark:text-emerald-400"
                : "text-rose-500 dark:text-rose-400"
            }
          />

          {/* Baseline (dashed) */}
          {baselinePath && (
            <path
              d={baselinePath}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.45"
              strokeWidth="1.25"
              strokeDasharray="3 4"
              className="text-text-faint"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Value line */}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            className={
              trendUp
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }
            vectorEffect="non-scaling-stroke"
          />

          {/* Last point dot */}
          <circle
            cx={xFor(last.t)}
            cy={yFor(last.v)}
            r="3.5"
            className={
              trendUp
                ? "fill-emerald-600 dark:fill-emerald-400"
                : "fill-rose-600 dark:fill-rose-400"
            }
          />

          {/* Hover crosshair + dot */}
          {hover && (
            <g>
              <line
                x1={xFor(hover.t)}
                x2={xFor(hover.t)}
                y1={PAD_T}
                y2={PAD_T + innerH}
                stroke="currentColor"
                strokeOpacity="0.35"
                strokeWidth="1"
                strokeDasharray="2 3"
                className="text-text-faint"
              />
              <circle
                cx={xFor(hover.t)}
                cy={yFor(hover.v)}
                r="5"
                className="fill-signals-accent stroke-background"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hover && (
          <div
            className="pointer-events-none absolute top-2 rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 text-[11px] font-mono shadow-lg tabular-nums z-10"
            style={{
              left: `calc(${(xFor(hover.t) / W) * 100}% + 8px)`,
              transform:
                xFor(hover.t) / W > 0.6
                  ? "translateX(calc(-100% - 16px))"
                  : undefined,
              minWidth: "160px",
            }}
          >
            <div className="text-text-faint text-[10px] uppercase tracking-wide">
              {fmtFullDate(hover.t)}
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span
                className={`text-sm font-semibold ${
                  trendUp
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {fmtValue(hover.v, decimals)}
              </span>
              <span className="text-text-faint">{unit}</span>
            </div>
            {hover.b != null && (
              <div className="text-[10px] text-text-faint">
                {baselineLabel}: {fmtValue(hover.b, decimals)} {unit}
                {hover.b !== 0 && (
                  <span
                    className={
                      hover.v >= hover.b
                        ? "ml-1 text-emerald-600 dark:text-emerald-400"
                        : "ml-1 text-rose-600 dark:text-rose-400"
                    }
                  >
                    ({hover.v >= hover.b ? "+" : ""}
                    {(((hover.v - hover.b) / Math.abs(hover.b)) * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer legend */}
      <div className="flex justify-between text-[10px] text-text-faint tabular-nums">
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-0.5 bg-emerald-500 dark:bg-emerald-400" />
          value · {unit}
          {baselinePath && (
            <>
              <span className="ml-2 inline-block w-3 border-t border-dashed border-current opacity-60" />
              {baselineLabel}
            </>
          )}
        </span>
        <span>
          {fmtFullDate(first.t)} → {fmtFullDate(last.t)}
        </span>
      </div>
    </div>
  );
}
