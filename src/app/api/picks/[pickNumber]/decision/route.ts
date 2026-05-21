import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";
import { transactions } from "@/data/stocks";

export const dynamic = "force-dynamic";

/**
 * POST /api/picks/[pickNumber]/decision
 *
 * The iOS user is telling us what they did with a pick.
 *
 * Body:
 *   { status: "bought", buy_price: number, amount_invested: number, save_as_default?: boolean }
 *   { status: "skipped" }
 *
 * Idempotent — re-posting flips the row. "save_as_default" persists the
 * amount onto subscribers.default_investment so the mini-sheet pre-fills
 * future picks without asking again.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ pickNumber: string }> }
) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { pickNumber: pickNumberStr } = await context.params;
  const pickNumber = parseInt(pickNumberStr, 10);
  if (!Number.isFinite(pickNumber) || pickNumber < 1) {
    return NextResponse.json({ error: "invalid_pick_number" }, { status: 400 });
  }

  const tx = transactions[pickNumber - 1];
  if (!tx) {
    return NextResponse.json({ error: "pick_not_found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const status = body.status;
  if (status !== "bought" && status !== "skipped") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  let buyPrice: number | null = null;
  let amountInvested: number | null = null;

  if (status === "bought") {
    buyPrice = Number(body.buy_price);
    amountInvested = Number(body.amount_invested);
    if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
      return NextResponse.json({ error: "invalid_buy_price" }, { status: 400 });
    }
    if (!Number.isFinite(amountInvested) || amountInvested <= 0) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }
  }

  const admin = getSupabaseAdmin();

  const { error: upsertErr } = await admin
    .from("user_pick_status")
    .upsert(
      {
        email: authed.email,
        pick_number: pickNumber,
        ticker: tx.ticker,
        status,
        buy_price: buyPrice,
        amount_invested: amountInvested,
        decided_at: new Date().toISOString(),
      },
      { onConflict: "email,pick_number" }
    );

  if (upsertErr) {
    console.error("[/api/picks/decision] upsert error:", upsertErr);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // If this is a "bought" decision and the user asked us to remember the
  // amount, persist it onto subscribers so the next mini-sheet pre-fills.
  let defaultInvestment: number | null = null;
  if (status === "bought" && body.save_as_default === true) {
    const { data: updated } = await admin
      .from("subscribers")
      .update({ default_investment: amountInvested })
      .eq("email", authed.email)
      .select("default_investment")
      .single();
    defaultInvestment = updated?.default_investment ?? null;
  } else {
    const { data: sub } = await admin
      .from("subscribers")
      .select("default_investment")
      .eq("email", authed.email)
      .single();
    defaultInvestment = sub?.default_investment ?? null;
  }

  return NextResponse.json({
    ok: true,
    pick_number: pickNumber,
    status,
    buy_price: buyPrice,
    amount_invested: amountInvested,
    default_investment: defaultInvestment,
  });
}

/**
 * DELETE /api/picks/[pickNumber]/decision
 *
 * Un-decide — flip back to pending. Useful if the user tapped "skip" by mistake.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ pickNumber: string }> }
) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { pickNumber: pickNumberStr } = await context.params;
  const pickNumber = parseInt(pickNumberStr, 10);
  if (!Number.isFinite(pickNumber) || pickNumber < 1) {
    return NextResponse.json({ error: "invalid_pick_number" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("user_pick_status")
    .delete()
    .eq("email", authed.email)
    .eq("pick_number", pickNumber);

  if (error) {
    console.error("[/api/picks/decision DELETE] error:", error);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pick_number: pickNumber, status: "pending" });
}
