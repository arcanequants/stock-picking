import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { pushConfigured, sendPushMany, type PushMessage } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ALLOWED_KINDS = [
  "new_pick",
  "weekly_digest",
  "news",
  "dividend_paid",
  "price_move",
  "system",
] as const;
type Kind = (typeof ALLOWED_KINDS)[number];

/**
 * Send ONE test push to ONE explicitly named account. QA-only escape hatch:
 * every real sender fans out to an audience, so there was no way to prove the
 * APNs/FCM wiring end-to-end without spamming live users.
 *
 * Gated by CRON_SECRET and requires ?email= — it never resolves an audience,
 * so it cannot fan out by accident.
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     "https://vectorialdata.com/api/admin/test-push?email=x@y.com&kind=new_pick&pick_number=133"
 *
 * Params: email (required) · platform (ios|android, default both) · kind ·
 * title · body · pick_number · news_id · ticker
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  const platform = url.searchParams.get("platform");
  if (platform && platform !== "ios" && platform !== "android") {
    return NextResponse.json({ error: "invalid_platform" }, { status: 400 });
  }

  const kindParam = url.searchParams.get("kind") ?? "system";
  if (!ALLOWED_KINDS.includes(kindParam as Kind)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }
  const kind = kindParam as Kind;

  const admin = getSupabaseAdmin();
  let query = admin
    .from("device_tokens")
    .select("token, platform, app_version, last_seen_at")
    .eq("email", email)
    .eq("is_active", true);
  if (platform) query = query.eq("platform", platform);

  const { data: devices, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "device_lookup_failed", detail: error.message },
      { status: 500 }
    );
  }
  if (!devices || devices.length === 0) {
    return NextResponse.json(
      { error: "no_active_devices", email, platform: platform ?? "any" },
      { status: 404 }
    );
  }

  const pickNumberRaw = url.searchParams.get("pick_number");
  const pickNumber = pickNumberRaw ? Number(pickNumberRaw) : undefined;
  const newsId = url.searchParams.get("news_id") ?? undefined;
  const ticker = url.searchParams.get("ticker") ?? undefined;

  const msg: PushMessage = {
    title: url.searchParams.get("title") ?? "Prueba de Vectorial Data",
    ...(url.searchParams.get("subtitle")
      ? { subtitle: url.searchParams.get("subtitle")! }
      : {}),
    body:
      url.searchParams.get("body") ??
      "Si ves esto, las notificaciones están funcionando.",
    data: {
      kind,
      ...(pickNumber !== undefined && Number.isFinite(pickNumber)
        ? { pick_number: pickNumber }
        : {}),
      ...(newsId ? { news_id: newsId } : {}),
      ...(ticker ? { ticker } : {}),
    },
  };

  const results = await sendPushMany(devices, msg);

  return NextResponse.json({
    ok: results.some((r) => r.ok),
    email,
    configured: pushConfigured(),
    sent: results.length,
    // Tokens are secrets-adjacent — only echo a prefix for correlation.
    results: results.map((r) => ({
      platform: r.platform,
      ok: r.ok,
      status: r.status,
      reason: r.reason,
      dead: r.dead,
      token_prefix: r.token.slice(0, 12),
    })),
  });
}
