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

export interface QuantLabBotView {
  bot: QuantLabBot;
  latest: QuantLabSnapshot | null;
  equityCurve: Array<{ t: string; roi: number }>;
  daysLive: number;
  simulatedCopier: { invested: number; wouldBe: number } | null;
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
  sparkline: Array<{ t: string; roi: number }>; // 30D ROI series
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

export async function getBotView(slug: string): Promise<QuantLabBotView | null> {
  const bot = await getBot(slug);
  if (!bot) return null;

  const admin = getSupabaseAdmin();
  const { data: snaps } = await admin
    .from("quant_lab_snapshots")
    .select("*")
    .eq("bot_id", bot.id)
    .eq("time_range", "30D")
    .order("captured_at", { ascending: true });

  const list = (snaps as QuantLabSnapshot[] | null) ?? [];
  const latest = list[list.length - 1] ?? null;
  const equityCurve = list
    .filter((s) => s.roi !== null)
    .map((s) => ({ t: s.captured_at, roi: Number(s.roi) }));

  const startedAt = new Date(bot.started_at).getTime();
  const daysLive = Math.max(
    0,
    Math.floor((Date.now() - startedAt) / (1000 * 60 * 60 * 24))
  );

  const simulatedCopier = latest?.roi != null
    ? { invested: 100, wouldBe: 100 * (1 + Number(latest.roi) / 100) }
    : null;

  return { bot, latest, equityCurve, daysLive, simulatedCopier };
}
