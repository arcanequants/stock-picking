"use client";

import { useMemo, useState } from "react";
import type { QuantLabCurve, CurveTab } from "@/lib/quant-lab";

interface Point {
  t: string;
  roi: number;
}

const W = 800;
const H = 320;
const M = { l: 12, r: 12, t: 14, b: 28 };
const PW = W - M.l - M.r;
const PH = H - M.t - M.b;

function buildView(curve: QuantLabCurve) {
  const bot = curve.bot;
  if (bot.length < 2) return null;
  const bench = curve.benchmark?.series ?? [];

  const startMs = new Date(bot[0].t).getTime();
  const endMs = new Date(bot[bot.length - 1].t).getTime();
  const span = Math.max(1, endMs - startMs);

  const allYs = [...bot.map((p) => p.roi), ...bench.map((p) => p.roi), 0];
  const yMin = Math.min(...allYs);
  const yMax = Math.max(...allYs);
  const range = yMax - yMin || 1;
  const pad = range * 0.12;
  const padMin = yMin - pad;
  const padMax = yMax + pad;
  const padRange = padMax - padMin;

  const xOf = (t: string) =>
    M.l + ((new Date(t).getTime() - startMs) / span) * PW;
  const yOf = (roi: number) =>
    M.t + (1 - (roi - padMin) / padRange) * PH;

  const toPath = (pts: Point[]) =>
    "M" +
    pts
      .map((p) => `${xOf(p.t).toFixed(2)},${yOf(p.roi).toFixed(2)}`)
      .join(" L");

  const botPath = toPath(bot);
  const lastX = xOf(bot[bot.length - 1].t).toFixed(2);
  const firstX = xOf(bot[0].t).toFixed(2);
  const baseY = (M.t + PH).toFixed(2);
  const botArea = `${botPath} L${lastX},${baseY} L${firstX},${baseY} Z`;

  const benchPath = bench.length > 1 ? toPath(bench) : null;
  const zeroY = yOf(0);

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  return {
    botPath,
    botArea,
    benchPath,
    zeroY,
    yMin: padMin,
    yMax: padMax,
    botEnd: bot[bot.length - 1].roi,
    benchEnd: bench.length > 0 ? bench[bench.length - 1].roi : null,
    startLabel: fmtDate(bot[0].t),
    endLabel: fmtDate(bot[bot.length - 1].t),
  };
}

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

export default function EquityCurve({
  curves,
  defaultTab,
}: {
  curves: QuantLabCurve[];
  defaultTab: CurveTab;
}) {
  const [activeTab, setActiveTab] = useState<CurveTab>(defaultTab);
  const curve = curves.find((c) => c.tab === activeTab) ?? curves[0];
  const view = useMemo(() => (curve ? buildView(curve) : null), [curve]);

  if (!curve) return null;

  return (
    <div className="border border-border rounded-2xl p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
        <h2 className="font-semibold">Curva de ROI</h2>
        {curves.length > 1 && (
          <div className="flex gap-1 text-xs">
            {curves.map((c) => (
              <button
                key={c.tab}
                onClick={() => setActiveTab(c.tab)}
                className={`px-2.5 py-1 rounded-full transition-colors ${
                  c.tab === activeTab
                    ? "bg-foreground text-background"
                    : "text-text-muted hover:text-foreground border border-border"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-text-faint mb-3">{curve.caption}</p>

      {!view ? (
        <div className="h-56 flex items-center justify-center text-center">
          <div>
            <p className="text-sm text-text-muted">
              Construyendo curva — se necesitan al menos 2 snapshots.
            </p>
            <p className="text-xs text-text-faint mt-1">
              El gráfico se rellena automáticamente cada 2 horas.
            </p>
          </div>
        </div>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="w-full block"
            style={{ aspectRatio: `${W}/${H}` }}
          >
            <defs>
              <linearGradient id="botGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>

            <line
              x1={M.l}
              x2={W - M.r}
              y1={view.zeroY}
              y2={view.zeroY}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeDasharray="3 3"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />

            {view.benchPath && (
              <path
                d={view.benchPath}
                fill="none"
                stroke="#94a3b8"
                strokeOpacity="0.7"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            )}

            <path d={view.botArea} fill="url(#botGradient)" />
            <path
              d={view.botPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>

          <div className="flex items-center justify-between mt-2 text-[11px] text-text-faint">
            <span>{view.startLabel}</span>
            <span>
              min {fmtPct(view.yMin)} · max {fmtPct(view.yMax)}
            </span>
            <span>{view.endLabel}</span>
          </div>

          <div className="flex items-center gap-5 mt-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block w-3 h-0.5 bg-emerald-500"
              />
              <span className="text-text-muted">
                Bot{" "}
                <span className="text-emerald-500 font-medium">
                  {fmtPct(view.botEnd)}
                </span>
              </span>
            </span>
            {curve.benchmark && view.benchEnd != null && (
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block w-3 border-t border-dashed border-slate-400"
                />
                <span className="text-text-muted">
                  {curve.benchmark.label}{" "}
                  <span className="text-text-secondary font-medium">
                    {fmtPct(view.benchEnd)}
                  </span>
                </span>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
