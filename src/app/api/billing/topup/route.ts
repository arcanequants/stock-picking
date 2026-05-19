import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { CREDIT_PACKS, getPack, type CreditPackId } from "@/lib/api-credit-packs";

export const dynamic = "force-dynamic";

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://vectorialdata.com")
  );
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { pack_id, api_key_id } = body as {
    pack_id?: CreditPackId;
    api_key_id?: string;
  };

  const pack = getPack(pack_id);
  if (!pack) {
    return NextResponse.json(
      {
        error: "Invalid pack_id",
        valid_packs: Object.values(CREDIT_PACKS).map((p) => p.id),
      },
      { status: 400 }
    );
  }

  // Resolve the api_key_id this top-up credits. If the client doesn't pass one,
  // pick the most recent non-revoked key for the user. If none, 404 — Phase 1.4
  // dashboard will surface a "create key" flow before the top-up button.
  let resolvedKeyId = api_key_id ?? null;
  if (resolvedKeyId) {
    const { data: keyRow } = await getSupabaseAdmin()
      .from("api_keys")
      .select("id")
      .eq("id", resolvedKeyId)
      .eq("account_id", user.id)
      .is("revoked_at", null)
      .maybeSingle();
    if (!keyRow) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }
  } else {
    const { data: keyRow } = await getSupabaseAdmin()
      .from("api_keys")
      .select("id")
      .eq("account_id", user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!keyRow) {
      return NextResponse.json(
        { error: "No API key on file. Create one first." },
        { status: 404 }
      );
    }
    resolvedKeyId = keyRow.id;
  }

  const site = getSiteUrl();

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pack.priceUsdCents,
          product_data: {
            name: `Vectorial Data API · ${pack.label} (${pack.credits.toLocaleString()} credits)`,
            description: `${pack.credits.toLocaleString()} API credits at $0.002/request.`,
          },
        },
      },
    ],
    customer_email: user.email ?? undefined,
    success_url: `${site}/api-keys?topup=success&pack=${pack.id}`,
    cancel_url: `${site}/api-keys?topup=cancel`,
    metadata: {
      purpose: "api_topup",
      account_id: user.id,
      api_key_id: resolvedKeyId!,
      pack_id: pack.id,
      credits: String(pack.credits),
    },
    payment_intent_data: {
      metadata: {
        purpose: "api_topup",
        account_id: user.id,
        api_key_id: resolvedKeyId!,
        pack_id: pack.id,
        credits: String(pack.credits),
      },
    },
  });

  return NextResponse.json({ url: session.url, session_id: session.id });
}
