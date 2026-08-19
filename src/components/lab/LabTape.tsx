"use client";

import { useMemo } from "react";
import type { LabData } from "@/lib/lab-data";

/**
 * The lab's pulse: two counter-scrolling tapes over the brand-night band.
 * Row 1 (→): stocks registry — aged returns, today's op (never its ticker),
 *            RANDOM attestations from the historical pool (real on-chain UIDs).
 * Row 2 (←): Dr X aggregates + recent closes (from the public equity curve),
 *            copy stats, betas. No open positions, no copyable signal beyond
 *            what the founder approved.
 * The shuffle runs per visit — every load shows a different mix.
 */

type Labels = {
  live: string;
  opPublished: string;   // {n}
  sinceBuy: string;      // {date}
  alsoPublish: string;
  attestVerified: string; // {count}
  rocLive: string;        // {pct} {trades}
  close: string;          // {label} {delta}
  replica: string;
  outcomesBeta: string;
  agentsApi: string;
};

function shuffle<T>(a: T[]): T[] {
  return a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
}

export default function LabTape({ data, labels, locale }: { data: LabData; labels: Labels; locale: string }) {
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(
        ({ es: "es-MX", en: "en-US", pt: "pt-BR", hi: "hi-IN" } as Record<string, string>)[locale] ?? "es-MX",
        { month: "short", year: "numeric" }
      ),
    [locale]
  );

  const { t1, t2 } = useMemo(() => {
    const t1: React.ReactNode[] = [
      <span key="live" className="vl-it vl-live">{labels.live}</span>,
      <span key="op" className="vl-it">
        <span className="vl-tag st">STOCKS</span>
        <span dangerouslySetInnerHTML={{ __html: labels.opPublished.replace("{n}", `<b>#${data.latestPickNumber}</b>`) }} />
      </span>,
    ];
    for (const p of shuffle(data.agedPositions)) {
      t1.push(
        <span key={`aged-${p.ticker}`} className="vl-it">
          <span className="vl-tag st">STOCKS</span>
          <b>{p.ticker}</b>
          <span className={p.pct >= 0 ? "vl-up" : "vl-dn"}>{p.pct >= 0 ? "+" : ""}{p.pct}%</span>
          <span>{p.pct >= 0 ? labels.sinceBuy.replace("{date}", dateFmt.format(new Date(p.since))) : labels.alsoPublish}</span>
        </span>
      );
    }
    for (const a of shuffle(data.attestSamplePool).slice(0, 4)) {
      t1.push(
        <span key={`at-${a.n}`} className="vl-it">
          <span className="vl-tag at">ATTEST</span>
          #{a.n} <b>{a.ticker}</b> <span className="vl-hash">{a.uid}</span> <span className="vl-chain">✓ BASE L2</span>
        </span>
      );
    }
    t1.push(
      <span key="attall" className="vl-it">
        <span className="vl-tag at">ATTEST</span>
        <span dangerouslySetInnerHTML={{ __html: labels.attestVerified.replace("{count}", `<b>${data.attestSamplePool.length}/${data.picksCount}</b>`) }} />
      </span>
    );

    const t2: React.ReactNode[] = [];
    if (data.drx) {
      t2.push(
        <span key="roc" className="vl-it">
          <span className="vl-tag dx">DR X</span>
          <span dangerouslySetInnerHTML={{
            __html: labels.rocLive
              .replace("{pct}", `<span class="${data.drx.liveRocPct >= 0 ? "vl-up" : "vl-dn"}">${data.drx.liveRocPct >= 0 ? "+" : ""}${data.drx.liveRocPct.toFixed(1)}%</span>`)
              .replace("{trades}", `<b>${data.drx.trades}</b>`),
          }} />
        </span>
      );
      for (const c of shuffle(data.drx.recentCloses)) {
        t2.push(
          <span key={`cl-${c.label}-${c.delta}`} className="vl-it">
            <span className="vl-tag dx">DR X</span>
            <span>{c.label}</span>
            <span className={c.delta >= 0 ? "vl-up" : "vl-dn"}>{c.delta >= 0 ? "+" : ""}${Math.abs(c.delta).toFixed(2)}</span>
          </span>
        );
      }
    }
    t2.push(
      <span key="rep" className="vl-it"><span className="vl-tag cp">COPY</span><span dangerouslySetInnerHTML={{ __html: labels.replica }} /></span>,
      <span key="beta" className="vl-it"><span className="vl-tag cp">COPY</span><span dangerouslySetInnerHTML={{ __html: labels.outcomesBeta }} /></span>,
      <span key="ag" className="vl-it"><span className="vl-tag dx">AGENTS</span><span dangerouslySetInnerHTML={{ __html: labels.agentsApi }} /></span>
    );
    return { t1, t2 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, labels]);

  return (
    <div className="vl-tape">
      <div className="vl-fade l" /><div className="vl-fade r" />
      <div className="vl-track t1">{t1}{t1}</div>
      <div className="vl-track t2">{t2}{t2}</div>
    </div>
  );
}
