import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  fetchLeadDetail,
  fetchLeadPerformance,
  type BinanceTimeRange,
} from "@/lib/binance-copy-trading";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
// Binance returns HTTP 451 for US-region IPs. Vercel's default iad1 is US,
// so we route this single function through Frankfurt.
export const preferredRegion = "fra1";

const TIME_RANGES: BinanceTimeRange[] = ["30D", "90D", "180D"];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { data: bots, error: botsErr } = await admin
    .from("quant_lab_bots")
    .select("id, slug, portfolio_id, is_active")
    .eq("is_active", true);

  if (botsErr) {
    return NextResponse.json({ error: botsErr.message }, { status: 500 });
  }

  const summary: Array<{ slug: string; captured: string[]; errors: string[] }> = [];

  for (const bot of bots ?? []) {
    const captured: string[] = [];
    const errors: string[] = [];

    let detail;
    try {
      detail = await fetchLeadDetail(bot.portfolio_id);
    } catch (e) {
      errors.push(`detail: ${(e as Error).message}`);
      summary.push({ slug: bot.slug, captured, errors });
      continue;
    }

    for (const range of TIME_RANGES) {
      try {
        const perf = await fetchLeadPerformance(bot.portfolio_id, range);
        const { error: insErr } = await admin.from("quant_lab_snapshots").insert({
          bot_id: bot.id,
          time_range: range,
          roi: perf.roi,
          pnl: perf.pnl,
          mdd: perf.mdd,
          copier_pnl: perf.copierPnl,
          win_rate: perf.winRate,
          win_orders: perf.winOrders,
          total_orders: perf.totalOrder,
          sharp_ratio: Number(perf.sharpRatio),
          aum_amount: Number(detail.aumAmount),
          margin_balance: Number(detail.marginBalance),
          current_copy_count: detail.currentCopyCount,
          max_copy_count: detail.maxCopyCount,
          total_copy_count: detail.totalCopyCount,
          rebate_fee: detail.rebateFee ? Number(detail.rebateFee) : null,
          raw_detail: detail,
          raw_performance: perf,
        });
        if (insErr) errors.push(`${range} insert: ${insErr.message}`);
        else captured.push(range);
      } catch (e) {
        errors.push(`${range}: ${(e as Error).message}`);
      }
    }

    summary.push({ slug: bot.slug, captured, errors });
  }

  return NextResponse.json({ success: true, summary });
}
