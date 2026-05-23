import { NextResponse } from "next/server";
import { getAuthedUser, getSupabase, getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/portfolio/history
 *
 *   - default: Vectorial model series + S&P reference. Cached, unauthed.
 *   - `?view=personal`: same array but every point gets `personal_return_pct`
 *     computed by replaying the authed user's `user_pick_status` rows against
 *     each snapshot's `prices` map. Vectorial stays as the reference line.
 *     Auth required; never cached.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const view = url.searchParams.get("view") === "personal" ? "personal" : "model";

  if (view === "personal") {
    return personalView(request);
  }
  return modelView();
}

async function modelView() {
  try {
    const { data, error } = await getSupabase()
      .from("portfolio_snapshots")
      .select("date, total_invested, total_value, return_pct, spy_return_pct, prices")
      .order("date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? [], {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

async function personalView(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [{ data: snapshots, error }, { data: bought }] = await Promise.all([
    getSupabase()
      .from("portfolio_snapshots")
      .select("date, return_pct, spy_return_pct, prices")
      .order("date", { ascending: true }),
    getSupabaseAdmin()
      .from("user_pick_status")
      .select("ticker, buy_price, amount_invested, decided_at")
      .eq("email", authed.email)
      .eq("status", "bought"),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = { ticker: string; buy_price: number; amount_invested: number; decided_at: string };
  const rows: Row[] = (bought ?? []) as Row[];

  // Pre-compute per-row shares + decided-at date key so we can replay cheaply.
  const buys = rows.map((r) => ({
    ticker: r.ticker,
    buyPrice: r.buy_price,
    invested: r.amount_invested,
    shares: r.amount_invested / r.buy_price,
    decidedAt: r.decided_at.slice(0, 10),
  }));

  const result = (snapshots ?? []).map((s) => {
    const dateKey = s.date as string;
    const prices = (s.prices as Record<string, number>) ?? {};
    let invested = 0;
    let value = 0;
    for (const b of buys) {
      if (b.decidedAt <= dateKey) {
        // If the snapshot is missing this ticker's price (recent pick not
        // yet snapshotted, data gap, etc.), value the position at its
        // entry price — same fallback as /api/portfolio/positions.
        const price = typeof prices[b.ticker] === "number" ? prices[b.ticker] : b.buyPrice;
        invested += b.invested;
        value += b.shares * price;
      }
    }
    const personalReturnPct =
      invested > 0
        ? Math.round(((value - invested) / invested) * 100 * 100) / 100
        : null;
    return {
      date: dateKey,
      return_pct: s.return_pct,
      spy_return_pct: s.spy_return_pct,
      personal_return_pct: personalReturnPct,
    };
  });

  return NextResponse.json(result);
}
