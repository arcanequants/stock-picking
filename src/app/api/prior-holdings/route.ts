import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";
import { stocks } from "@/data/stocks";

export const dynamic = "force-dynamic";

/**
 * Prior holdings — positions the user owned BEFORE joining Vectorial.
 * Only tickers that are Vectorial picks are accepted (canonical list
 * lives in `src/data/stocks.ts`). Aggregated by
 * `/api/portfolio/positions?view=personal` alongside `user_pick_status`
 * rows so the user's total position size + weighted avg buy price
 * reflect their full real holdings.
 *
 *  GET    /api/prior-holdings           — list current user's rows
 *  POST   /api/prior-holdings           — add one
 *      body: { ticker, purchase_date, amount_invested, buy_price }
 *  (DELETE lives in /api/prior-holdings/[id]/route.ts)
 */

interface CreatePayload {
  ticker?: unknown;
  purchase_date?: unknown;
  amount_invested?: unknown;
  buy_price?: unknown;
}

function isVectorialTicker(ticker: string): boolean {
  return stocks.some((s) => s.ticker === ticker);
}

export async function GET(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("prior_holdings")
    .select("id, ticker, purchase_date, buy_price, amount_invested, created_at")
    .eq("email", authed.email)
    .order("purchase_date", { ascending: false });

  if (error) {
    console.error("prior_holdings GET error:", error);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  const rows = (data ?? []).map((r) => {
    const stock = stocks.find((s) => s.ticker === r.ticker);
    return {
      id: r.id,
      ticker: r.ticker,
      name: stock?.name ?? r.ticker,
      purchase_date: r.purchase_date,
      buy_price: Number(r.buy_price),
      amount_invested: Number(r.amount_invested),
      shares: Number(r.amount_invested) / Number(r.buy_price),
      created_at: r.created_at,
    };
  });

  return NextResponse.json({ holdings: rows });
}

export async function POST(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: CreatePayload;
  try {
    body = (await request.json()) as CreatePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const tickerRaw = typeof body.ticker === "string" ? body.ticker.toUpperCase().trim() : "";
  const purchaseDate = typeof body.purchase_date === "string" ? body.purchase_date.trim() : "";
  const buyPrice = typeof body.buy_price === "number" ? body.buy_price : NaN;
  const amount = typeof body.amount_invested === "number" ? body.amount_invested : NaN;

  if (!tickerRaw) {
    return NextResponse.json({ error: "missing_ticker" }, { status: 400 });
  }
  if (!isVectorialTicker(tickerRaw)) {
    return NextResponse.json(
      { error: "ticker_not_in_vectorial", message: "Solo puedes agregar posiciones de tickers que son picks de Vectorial." },
      { status: 400 }
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  // Date must be in the past, not in the future.
  const today = new Date().toISOString().slice(0, 10);
  if (purchaseDate > today) {
    return NextResponse.json({ error: "future_date" }, { status: 400 });
  }
  if (!isFinite(buyPrice) || buyPrice <= 0) {
    return NextResponse.json({ error: "invalid_buy_price" }, { status: 400 });
  }
  if (!isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("prior_holdings")
    .insert({
      email: authed.email,
      ticker: tickerRaw,
      purchase_date: purchaseDate,
      buy_price: buyPrice,
      amount_invested: amount,
    })
    .select("id, ticker, purchase_date, buy_price, amount_invested, created_at")
    .single();

  if (error) {
    console.error("prior_holdings POST error:", error);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  const stock = stocks.find((s) => s.ticker === data.ticker);
  return NextResponse.json({
    holding: {
      id: data.id,
      ticker: data.ticker,
      name: stock?.name ?? data.ticker,
      purchase_date: data.purchase_date,
      buy_price: Number(data.buy_price),
      amount_invested: Number(data.amount_invested),
      shares: Number(data.amount_invested) / Number(data.buy_price),
      created_at: data.created_at,
    },
  });
}
