import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/me/default-investment — set or clear the user's default
 * "monto por pick". Pass `{ amount: number }` to set, or `{ amount: null }`
 * to clear so the next bought-pick sheet asks fresh.
 */
export async function POST(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { amount?: number | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const raw = body.amount;
  let amount: number | null;
  // Treat a missing key as an explicit clear: both apps' JSON encoders
  // (Swift Encodable, kotlinx explicitNulls=false) drop nil/null fields,
  // so "clear" arrives as {} — a strict null check 400'd it (live iOS bug).
  if (raw === null || raw === undefined) {
    amount = null;
  } else if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    amount = Math.round(raw * 100) / 100;
  } else {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("subscribers")
    .update({ default_investment: amount })
    .eq("email", authed.email);

  if (error) {
    console.error("[default-investment] update failed:", error);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, default_investment: amount });
}
