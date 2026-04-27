import { getSupabaseAdmin } from "@/lib/supabase";

export interface QuantLabBot {
  id: number;
  slug: string;
  name: string;
  exchange: string;
  portfolio_id: string;
  lead_details_url: string;
  referral_url: string | null;
  asset_class: string;
  description: string | null;
  started_at: string;
  is_active: boolean;
}

export interface QuantLabSnapshot {
  captured_at: string;
  time_range: string;
  roi: number | null;
  pnl: number | null;
  mdd: number | null;
  copier_pnl: number | null;
  win_rate: number | null;
  win_orders: number | null;
  total_orders: number | null;
  sharp_ratio: number | null;
  aum_amount: number | null;
  margin_balance: number | null;
  current_copy_count: number | null;
  max_copy_count: number | null;
  total_copy_count: number | null;
}

export type CurveTab = "inception" | "30D" | "90D" | "365D";

export interface QuantLabCurve {
  tab: CurveTab;
  label: string;
  caption: string;
  bot: Array<{ t: string; roi: number }>;
  benchmark: { symbol: string; label: string; series: Array<{ t: string; roi: number }> } | null;
}

export interface QuantLabBotView {
  bot: QuantLabBot;
  latest: QuantLabSnapshot | null;
  curves: QuantLabCurve[];
  defaultTab: CurveTab;
  daysLive: number;
}

export async function getBot(slug: string): Promise<QuantLabBot | null> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("quant_lab_bots")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as QuantLabBot | null) ?? null;
}

export async function getAllBots(): Promise<QuantLabBot[]> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("quant_lab_bots")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return (data as QuantLabBot[] | null) ?? [];
}

export interface QuantLabBotCard {
  bot: QuantLabBot;
  latest: QuantLabSnapshot | null;
  sparkline: Array<{ t: string; roi: number }>;
  daysLive: number;
}

export async function getAllBotCards(): Promise<QuantLabBotCard[]> {
  const admin = getSupabaseAdmin();
  const bots = await getAllBots();
  if (bots.length === 0) return [];

  const ids = bots.map((b) => b.id);
  const { data: snaps } = await admin
    .from("quant_lab_snapshots")
    .select("bot_id, captured_at, roi, mdd, current_copy_count, win_rate, total_orders, aum_amount, time_range")
    .in("bot_id", ids)
    .eq("time_range", "30D")
    .order("captured_at", { ascending: true });

  const byBot = new Map<number, QuantLabSnapshot[]>();
  for (const row of (snaps as Array<QuantLabSnapshot & { bot_id: number }> | null) ?? []) {
    const arr = byBot.get(row.bot_id) ?? [];
    arr.push(row);
    byBot.set(row.bot_id, arr);
  }

  return bots.map((bot) => {
    const list = byBot.get(bot.id) ?? [];
    const latest = list[list.length - 1] ?? null;
    const sparkline = list
      .filter((s) => s.roi !== null)
      .map((s) => ({ t: s.captured_at, roi: Number(s.roi) }));
    const startedAt = new Date(bot.started_at).getTime();
    const daysLive = Math.max(
      0,
      Math.floor((Date.now() - startedAt) / (1000 * 60 * 60 * 24))
    );
    return { bot, latest, sparkline, daysLive };
  });
}

const BENCHMARKS: Record<string, { symbol: string; label: string }> = {
  crypto: { symbol: "BTC-USD", label: "BTC" },
  "crypto-futures": { symbol: "BTC-USD", label: "BTC" },
  stocks: { symbol: "SPY", label: "S&P 500" },
  metals: { symbol: "GC=F", label: "Oro" },
};

function pickInceptionRange(daysLive: number): string {
  if (daysLive <= 30) return "30D";
  if (daysLive <= 90) return "90D";
  if (daysLive <= 180) return "180D";
  return "365D";
}

const fmtDateES = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

function snapsToSeries(snaps: QuantLabSnapshot[]): Array<{ t: string; roi: number }> {
  return snaps
    .filter((s) => s.roi !== null)
    .map((s) => ({ t: s.captured_at, roi: Number(s.roi) }));
}

async function fetchBenchmark(
  assetClass: string,
  botSeries: Array<{ t: string; roi: number }>,
): Promise<QuantLabCurve["benchmark"]> {
  const cfg = BENCHMARKS[assetClass];
  if (!cfg || botSeries.length < 2) return null;
  try {
    const startMs = new Date(botSeries[0].t).getTime();
    const endMs = new Date(botSeries[botSeries.length - 1].t).getTime();
    const period1 = Math.floor((startMs - 86400_000) / 1000);
    const period2 = Math.floor(endMs / 1000);
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cfg.symbol)}?period1=${period1}&period2=${period2}&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> };
    };
    const result = json.chart?.result?.[0];
    const ts = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const pairs = ts
      .map((t, i) => ({ t: new Date(t * 1000).toISOString(), c: closes[i] }))
      .filter((p): p is { t: string; c: number } => typeof p.c === "number");
    if (pairs.length < 2) return null;
    const base = pairs[0].c;
    const series = pairs.map((p) => ({ t: p.t, roi: ((p.c - base) / base) * 100 }));
    return { symbol: cfg.symbol, label: cfg.label, series };
  } catch (e) {
    console.error("benchmark fetch failed", cfg.symbol, e);
    return null;
  }
}

export async function getBotView(slug: string): Promise<QuantLabBotView | null> {
  const bot = await getBot(slug);
  if (!bot) return null;

  const admin = getSupabaseAdmin();
  const { data: snaps } = await admin
    .from("quant_lab_snapshots")
    .select("*")
    .eq("bot_id", bot.id)
    .order("captured_at", { ascending: true });

  const all = (snaps as QuantLabSnapshot[] | null) ?? [];
  const byRange = new Map<string, QuantLabSnapshot[]>();
  for (const s of all) {
    const arr = byRange.get(s.time_range) ?? [];
    arr.push(s);
    byRange.set(s.time_range, arr);
  }

  const list30D = byRange.get("30D") ?? [];
  const latest = list30D[list30D.length - 1] ?? null;

  const startedAt = new Date(bot.started_at).getTime();
  const daysLive = Math.max(
    0,
    Math.floor((Date.now() - startedAt) / (1000 * 60 * 60 * 24))
  );

  const inceptionRange = pickInceptionRange(daysLive);
  const startedDateLabel = fmtDateES(bot.started_at);

  const curves: QuantLabCurve[] = [];

  const inceptionSeries = snapsToSeries(byRange.get(inceptionRange) ?? []);
  const inceptionBench = await fetchBenchmark(bot.asset_class, inceptionSeries);
  curves.push({
    tab: "inception",
    label: `Desde inicio (${daysLive}d)`,
    caption: `ROI acumulado desde ${startedDateLabel}.`,
    bot: inceptionSeries,
    benchmark: inceptionBench,
  });

  if (daysLive > 30) {
    curves.push({
      tab: "30D",
      label: "30d",
      caption: "ROI de los últimos 30 días (ventana móvil).",
      bot: snapsToSeries(byRange.get("30D") ?? []),
      benchmark: null,
    });
  }

  if (daysLive > 90) {
    curves.push({
      tab: "90D",
      label: "90d",
      caption: "ROI de los últimos 90 días (ventana móvil).",
      bot: snapsToSeries(byRange.get("90D") ?? []),
      benchmark: null,
    });
  }

  if (daysLive > 365) {
    curves.push({
      tab: "365D",
      label: "365d",
      caption: "ROI de los últimos 365 días (ventana móvil).",
      bot: snapsToSeries(byRange.get("365D") ?? []),
      benchmark: null,
    });
  }

  return {
    bot,
    latest,
    curves,
    defaultTab: "inception",
    daysLive,
  };
}
