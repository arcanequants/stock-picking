import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { configuredPlatforms, sendPushMany, type PushDevice } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Who gets woken up when something is down. */
const OWNER_EMAIL = (process.env.ALERT_EMAIL ?? "arcanequant@icloud.com").toLowerCase();

/**
 * GET /api/cron/health-sentinel — every 6h (dead-man's switch).
 *
 * Pulls /api/health and pushes an alert to the OWNER's devices when any
 * check fails. Runs every 6h so a broken state re-alerts at most 4×/day
 * without needing alert-dedup storage. The claude.ai sentinel routine is
 * the diagnosing/remediating layer; this one only guarantees a human hears
 * about it within hours, not days.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let health: {
    ok: boolean;
    checks: Record<string, boolean>;
    meta?: Record<string, unknown>;
  };
  try {
    const res = await fetch("https://vectorialdata.com/api/health", {
      cache: "no-store",
    });
    health = await res.json();
  } catch (err) {
    health = { ok: false, checks: { health_endpoint: false } };
    console.error("[health-sentinel] health fetch failed:", err);
  }

  if (health.ok) {
    return NextResponse.json({ ok: true, alerted: false });
  }

  const failing = Object.entries(health.checks)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  console.error("[health-sentinel] FAILING CHECKS:", failing, health.meta);

  // Wake the owner on every registered device.
  const { data: tokens } = await getSupabaseAdmin()
    .from("device_tokens")
    .select("token, platform")
    .eq("email", OWNER_EMAIL)
    .eq("is_active", true)
    .in("platform", configuredPlatforms());

  const devices: PushDevice[] = (tokens ?? []).map((t) => ({
    token: t.token,
    platform: t.platform,
  }));

  let sent = 0;
  if (devices.length > 0) {
    const results = await sendPushMany(devices, {
      title: "⚠️ Vectorial — sistema con problemas",
      body: `Fallando: ${failing.join(", ")}. El centinela cloud intentará remediar; revisa cuando puedas.`,
      threadId: "health",
      data: { kind: "system" },
    });
    sent = results.filter((r) => r.ok).length;
  }

  return NextResponse.json({ ok: false, failing, alerted: sent > 0, sent });
}
