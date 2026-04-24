import { NextResponse } from "next/server";
import { getAuthState } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: returns the current monthly_budget for the caller.
// POST: upserts monthly_budget. Accepts auth session OR a valid Stripe
// session_id (for fresh post-checkout arrivals who haven't activated the
// magic link yet — same pattern as /api/subscriber/wa-invite).

const MIN_BUDGET = 30;
const MAX_BUDGET = 100000;

async function resolveEmail(request: Request): Promise<string | null> {
  const auth = await getAuthState();
  if (auth.isSubscribed && auth.user?.email) {
    return auth.user.email.toLowerCase().trim();
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) return null;

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email ?? session.customer_email;
    if (session.payment_status === "paid" && email) {
      return email.toLowerCase().trim();
    }
  } catch (err) {
    console.error("Stripe session validation failed:", err);
  }
  return null;
}

export async function GET(request: Request) {
  const email = await resolveEmail(request);
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("subscribers")
    .select("monthly_budget")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  return NextResponse.json({ monthlyBudget: data?.monthly_budget ?? null });
}

export async function POST(request: Request) {
  const email = await resolveEmail(request);
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    monthlyBudget?: unknown;
  };
  const raw = Number(body.monthlyBudget);

  if (!Number.isFinite(raw) || raw < MIN_BUDGET || raw > MAX_BUDGET) {
    return NextResponse.json(
      { error: "invalid_budget", min: MIN_BUDGET, max: MAX_BUDGET },
      { status: 400 }
    );
  }

  const rounded = Math.round(raw * 100) / 100;

  const { error } = await getSupabaseAdmin()
    .from("subscribers")
    .update({
      monthly_budget: rounded,
      monthly_budget_set_at: new Date().toISOString(),
    })
    .eq("email", email);

  if (error) {
    console.error("Failed to save monthly_budget:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    monthlyBudget: rounded,
    perPick: Math.round((rounded / 30) * 100) / 100,
  });
}
