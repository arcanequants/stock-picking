"use client";

import { useMemo, useRef, useState } from "react";
import type { DrxData, StocksSeriesPoint } from "@/lib/lab-data";

/**
 * Hero chart: one strategy at a time — the best performer opens by default
 * (founder rule: the first screen always shows the strongest portfolio).
 * Smoothed Catmull-Rom curve, animated draw-in, crosshair tooltip.
 * All data is real: stocks from portfolio snapshots, Dr X from the
 * Terminal's public leaders endpoint (live ROC, open positions included).
 */

const X0 = 44, X1 = 512, Y0 = 158, YTOP = 22;

type Dataset = {
  key: "stocks" | "drx";
  title: string;
  sub: string;
  val: string;
  note: string;
  maxPct: number;
  vals: number[];
  xLabels: string[];
};

function smooth(pts: Array<[number, number]>): string {
  if (pts.length < 3) return "M" + pts.map((p) => p.join(" ")).join(" L ");
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1],
      p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function niceMax(v: number): number {
  const m = Math.max(2, Math.ceil(v * 1.25));
  return m % 2 === 0 ? m : m + 1;
}

export default function LabHeroChart({
  stocksSeries,
  stocksReturnPct,
  drx,
  labels,
  locale,
}: {
  stocksSeries: StocksSeriesPoint[];
  stocksReturnPct: number | null;
  drx: DrxData;
  labels: {
    stocksTitle: string; stocksSub: string; stocksNote: string;
    drxTitle: string; drxSub: string; drxNote: string;
    tabStocks: string; tabDrx: string;
  };
  locale: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cur, setCur] = useState<"stocks" | "drx">(() => {
    const s = stocksReturnPct ?? -Infinity;
    const x = drx && drx.equity.length >= 2 ? drx.liveRocPct : -Infinity;
    return x > s ? "drx" : "stocks";
  });
  const [hover, setHover] = useState<number | null>(null);

  const monthFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(
        ({ es: "es-MX", en: "en-US", pt: "pt-BR", hi: "hi-IN" } as Record<string, string>)[locale] ?? "es-MX",
        { month: "short" }
      ),
    [locale]
  );

  const datasets = useMemo(() => {
    const out: Partial<Record<"stocks" | "drx", Dataset>> = {};
    if (stocksSeries.length >= 2) {
      const vals = stocksSeries.map((p) => p.pct);
      const seen = new Set<string>();
      const xLabels = stocksSeries.map((p) => {
        const m = monthFmt.format(new Date(p.date)).toUpperCase().replace(".", "");
        if (seen.has(m)) return "";
        seen.add(m);
        return m;
      });
      out.stocks = {
        key: "stocks",
        title: labels.stocksTitle,
        sub: labels.stocksSub,
        val: `${(stocksReturnPct ?? vals[vals.length - 1]) >= 0 ? "+" : ""}${(stocksReturnPct ?? vals[vals.length - 1]).toFixed(2)}%`,
        note: labels.stocksNote,
        maxPct: niceMax(Math.max(...vals.map(Math.abs))),
        vals,
        xLabels,
      };
    }
    if (drx && drx.equity.length >= 2) {
      // Convert $-PnL curve to % ROC over strategy capital implied by liveRoc.
      const eq = drx.equity;
      const lastV = eq[eq.length - 1].v || 1;
      const scale = lastV !== 0 ? drx.liveRocPct / lastV : 1;
      const step = Math.max(1, Math.floor(eq.length / 15));
      const sampled = eq.filter((_, i) => i % step === 0 || i === eq.length - 1);
      const vals = sampled.map((p) => Math.round(p.v * scale * 100) / 100);
      const seen = new Set<string>();
      const xLabels = sampled.map((p) => {
        const m = monthFmt.format(new Date(p.t)).toUpperCase().replace(".", "");
        if (seen.has(m)) return "";
        seen.add(m);
        return m;
      });
      out.drx = {
        key: "drx",
        title: labels.drxTitle,
        sub: labels.drxSub,
        val: `${drx.liveRocPct >= 0 ? "+" : ""}${drx.liveRocPct.toFixed(2)}%`,
        note: labels.drxNote,
        maxPct: niceMax(Math.max(...vals.map(Math.abs))),
        vals,
        xLabels,
      };
    }
    return out;
  }, [stocksSeries, stocksReturnPct, drx, labels, monthFmt]);

  const ds = datasets[cur] ?? datasets.stocks;
  if (!ds) return null;

  const n = ds.vals.length;
  const xs = (i: number) => X0 + ((X1 - X0) * i) / (n - 1);
  const y = (pct: number) => Y0 - (pct / ds.maxPct) * (Y0 - YTOP);
  const pts: Array<[number, number]> = ds.vals.map((v, i) => [xs(i), y(v)]);
  const d = smooth(pts);
  const last = pts[pts.length - 1];
  const hoverPt = hover != null ? pts[hover] : null;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const mx = ((e.clientX - r.left) * 520) / r.width;
    if (mx < X0 || mx > X1) return setHover(null);
    let best = 0, bd = Infinity;
    pts.forEach((p, i) => {
      const dd = Math.abs(p[0] - mx);
      if (dd < bd) { bd = dd; best = i; }
    });
    setHover(best);
  };

  const tipVal = hover != null ? `${ds.vals[hover] >= 0 ? "+" : ""}${ds.vals[hover].toFixed(2)}%` : "";
  const tipW = tipVal.length * 7.2 + 14;
  const tipX = hoverPt ? Math.min(Math.max(hoverPt[0] - tipW / 2, X0), X1 - tipW) : 0;

  return (
    <div className="vl-chart">
      <div className="vl-chart-cap">
        <div>
          <b>{ds.title}</b>
          <small>{ds.sub}</small>
        </div>
        <span className="vl-chart-val">{ds.val}</span>
      </div>
      {datasets.stocks && datasets.drx && (
        <div className="vl-tabs">
          <button className={cur === "stocks" ? "on" : ""} onClick={() => { setCur("stocks"); setHover(null); }}>{labels.tabStocks}</button>
          <button className={cur === "drx" ? "on" : ""} onClick={() => { setCur("drx"); setHover(null); }}>{labels.tabDrx}</button>
        </div>
      )}
      <svg ref={svgRef} viewBox="0 0 520 196" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="vlFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#18A8D8" stopOpacity=".22" />
            <stop offset=".55" stopColor="#18A8D8" stopOpacity=".07" />
            <stop offset="1" stopColor="#18A8D8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line className="vl-gridline" x1={X0} y1={y(ds.maxPct * f)} x2={X1} y2={y(ds.maxPct * f)} strokeWidth="1" strokeDasharray={f > 0 ? "1 5" : undefined} />
            <text className="vl-axis vl-mono" x={X0 - 9} y={y(ds.maxPct * f) + 4} fontSize="10.5" textAnchor="end">
              {f === 0 ? "0%" : `+${ds.maxPct * f}%`}
            </text>
          </g>
        ))}
        {ds.xLabels.map((m, i) =>
          m ? (
            <text key={i} className="vl-axis vl-mono" x={Math.min(xs(i), X1 - 26)} y={180} fontSize="10" letterSpacing="1">{m}</text>
          ) : null
        )}
        <path fill="url(#vlFade)" d={`${d} L ${X1} ${Y0} L ${X0} ${Y0} Z`} />
        <path key={cur} className="vl-draw" fill="none" stroke="var(--vl-accent)" strokeWidth="2.4" strokeLinecap="round" d={d} />
        {hoverPt && (
          <g>
            <line x1={hoverPt[0]} x2={hoverPt[0]} y1={14} y2={162} stroke="#8E9BB8" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={hoverPt[0]} cy={hoverPt[1]} r="4.5" fill="var(--vl-card)" stroke="var(--vl-accent)" strokeWidth="2" />
            <rect x={tipX} y={hoverPt[1] - 34} width={tipW} height={22} rx="5" fill="#0B1026" stroke="#28325A" />
            <text x={tipX + 7} y={hoverPt[1] - 19} fontSize="11" fill="#fff" fontFamily="var(--font-lab-mono)">{tipVal}</text>
          </g>
        )}
        <circle cx={last[0]} cy={last[1]} r="9" fill="#18A8D8" opacity=".18" />
        <circle className="vl-pulse" cx={last[0]} cy={last[1]} r="4" fill="#18A8D8" stroke="var(--vl-card)" strokeWidth="1.5" />
      </svg>
      <div className="vl-chart-note">{ds.note}</div>
    </div>
  );
}
