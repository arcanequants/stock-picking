import { stocks, transactions } from "@/data/stocks";
import { getSupabase } from "@/lib/supabase";

/**
 * Data layer for the Quant Lab homepage (and /api/lab/pulse).
 *
 * Aggregates the lab's public numbers from three sources:
 *  - local: stocks.ts + the latest portfolio snapshot (Supabase)
 *  - the Terminal's public copy-leaders endpoint (Dr X live card)
 *  - the Terminal's markets catalog + sitemap (market counts)
 *
 * Every remote read is cached and has a static fallback: the homepage must
 * degrade gracefully — never 500, never block — if the Terminal is down.
 */

const TERMINAL = "https://terminal.vectorialdata.com";

/* ---------- types ---------- */

export type EquityPoint = { t: number; v: number; label?: string };

export type DrxData = {
  liveRocPct: number;
  trades: number;
  sharpe: number | null;
  maxDrawdown: number | null;
  activeFollowers: number;
  aumUsd: number;
  minCapitalUsd: number;
  equity: EquityPoint[];
  /** last closes derived from equity labels: [label, delta] */
  recentCloses: Array<{ label: string; delta: number }>;
} | null;

export type StocksSeriesPoint = { date: string; pct: number };

export type LabData = {
  updatedAt: string;
  totalOperations: number; // picks + Dr X closed trades
  picksCount: number;
  countries: number;
  assetClasses: number;
  marketsCount: number; // perps + prediction markets (terminal)
  stocks: {
    returnPct: number | null;
    since: string;
    best: { ticker: string; pct: number } | null;
    worst: { ticker: string; pct: number } | null;
    series: StocksSeriesPoint[];
  };
  drx: DrxData;
  attestSamplePool: Array<{ n: number; ticker: string; uid: string }>;
  agedPositions: Array<{ ticker: string; pct: number; since: string }>;
  latestPickNumber: number;
};

/* ---------- remote fetchers (cached, fallback-safe) ---------- */

async function fetchDrx(): Promise<DrxData> {
  try {
    const res = await fetch(`${TERMINAL}/api/copy/leaders`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      leaders?: Array<Record<string, unknown>>;
    };
    const leader = (data.leaders ?? []).find(
      (l) => (l.display_name as string)?.toLowerCase() === "dr x"
    );
    if (!leader) return null;
    const strat = (leader.strategy ?? {}) as Record<string, unknown>;
    const equity = ((strat.equity ?? []) as EquityPoint[]).filter(
      (p) => typeof p?.t === "number" && typeof p?.v === "number"
    );
    // Recent closes: consecutive labelled points → delta between them.
    const labelled = equity.filter((p) => p.label && p.label !== "Strategy start");
    const recentCloses = labelled.slice(-4).map((p, i, arr) => {
      const prev = i === 0
        ? equity[Math.max(0, equity.indexOf(p) - 1)]
        : arr[i - 1];
      return {
        label: p.label as string,
        delta: Math.round((p.v - (prev?.v ?? 0)) * 100) / 100,
      };
    });
    return {
      liveRocPct: (strat.liveRocPct as number) ?? (strat.rocPct as number) ?? 0,
      trades: (strat.trades as number) ?? 0,
      sharpe: (strat.sharpe as number) ?? null,
      maxDrawdown: (strat.maxDrawdown as number) ?? null,
      activeFollowers: (leader.activeFollowers as number) ?? 0,
      aumUsd: (leader.aumUsd as number) ?? 0,
      minCapitalUsd: (leader.min_capital_usd as number) ?? 100,
      equity,
      recentCloses,
    };
  } catch {
    return null;
  }
}

async function fetchMarketsCount(): Promise<number> {
  // Perps catalog (public agent API) + prediction markets counted from the
  // Terminal's public sitemap. Both cached a day — these move slowly.
  try {
    const [perpsRes, sitemapRes] = await Promise.all([
      fetch(`${TERMINAL}/api/agent/v1/markets`, { next: { revalidate: 86400 } }),
      fetch(`${TERMINAL}/sitemap.xml`, { next: { revalidate: 86400 } }),
    ]);
    let count = 0;
    if (perpsRes.ok) {
      const d = (await perpsRes.json()) as { markets?: unknown[] };
      count += d.markets?.length ?? 0;
    }
    if (sitemapRes.ok) {
      const xml = await sitemapRes.text();
      count += (xml.match(/\/events\//g) ?? []).length;
    }
    return count > 0 ? count : 2300;
  } catch {
    return 2300;
  }
}

async function fetchStocksSeries(): Promise<{
  series: StocksSeriesPoint[];
  returnPct: number | null;
  best: { ticker: string; pct: number } | null;
  worst: { ticker: string; pct: number } | null;
}> {
  try {
    const { data } = await getSupabase()
      .from("portfolio_snapshots")
      .select("date, return_pct, prices")
      .order("date", { ascending: true });
    const rows = data ?? [];
    if (rows.length === 0)
      return { series: [], returnPct: null, best: null, worst: null };

    // Weekly-ish downsample for the hero chart (~14 points).
    const step = Math.max(1, Math.floor(rows.length / 14));
    const series: StocksSeriesPoint[] = rows
      .filter((_, i) => i % step === 0 || i === rows.length - 1)
      .map((r) => ({ date: r.date as string, pct: r.return_pct as number }));

    // Live best/worst from the latest snapshot prices vs entry price.
    const latest = rows[rows.length - 1];
    const prices = (latest.prices ?? {}) as Record<string, number>;
    let best: { ticker: string; pct: number } | null = null;
    let worst: { ticker: string; pct: number } | null = null;
    const seen = new Set<string>();
    for (const tx of transactions) {
      if (seen.has(tx.ticker)) continue; // first entry per ticker
      seen.add(tx.ticker);
      const cur = prices[tx.ticker];
      if (!cur || !tx.price) continue;
      const pct = ((cur - tx.price) / tx.price) * 100;
      if (!best || pct > best.pct) best = { ticker: tx.ticker, pct };
      if (!worst || pct < worst.pct) worst = { ticker: tx.ticker, pct };
    }
    if (best) best.pct = Math.round(best.pct);
    if (worst) worst.pct = Math.round(worst.pct);
    return {
      series,
      returnPct: (latest.return_pct as number) ?? null,
      best,
      worst,
    };
  } catch {
    return { series: [], returnPct: null, best: null, worst: null };
  }
}

/* ---------- main aggregate ---------- */

export async function getLabData(): Promise<LabData> {
  const [drx, marketsCount, stocksData] = await Promise.all([
    fetchDrx(),
    fetchMarketsCount(),
    fetchStocksSeries(),
  ]);

  const countries = new Set(
    stocks.filter((s) => !["Global", "Multi-Country", "Asia"].includes(s.country))
      .map((s) => s.country)
  ).size;

  // Aged positions for the tape (>30 days old, real return vs today).
  const cutoff = Date.now() - 30 * 86400 * 1000;
  const aged: LabData["agedPositions"] = [];
  if (stocksData.best) {
    const firstTx = transactions.find((t) => t.ticker === stocksData.best!.ticker);
    if (firstTx && new Date(firstTx.date).getTime() < cutoff)
      aged.push({ ticker: stocksData.best.ticker, pct: stocksData.best.pct, since: firstTx.date });
  }
  if (stocksData.worst) {
    const firstTx = transactions.find((t) => t.ticker === stocksData.worst!.ticker);
    if (firstTx && new Date(firstTx.date).getTime() < cutoff)
      aged.push({ ticker: stocksData.worst.ticker, pct: stocksData.worst.pct, since: firstTx.date });
  }

  return {
    updatedAt: new Date().toISOString(),
    totalOperations: transactions.length + (drx?.trades ?? 0),
    picksCount: transactions.length,
    countries,
    assetClasses: 5,
    marketsCount,
    stocks: {
      returnPct: stocksData.returnPct,
      since: transactions[0]?.date ?? "2026-03-04",
      best: stocksData.best,
      worst: stocksData.worst,
      series: stocksData.series,
    },
    drx,
    attestSamplePool: transactions
      .filter((t) => t.attestation_uid)
      .map((t) => ({
        n: t.id,
        ticker: t.ticker,
        uid: `${t.attestation_uid!.slice(0, 12)}…${t.attestation_uid!.slice(-4)}`,
      })),
    agedPositions: aged,
    latestPickNumber: transactions[transactions.length - 1]?.id ?? 0,
  };
}
