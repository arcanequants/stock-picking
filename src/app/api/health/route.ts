import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — PUBLIC, read-only system health summary.
 *
 * Deliberately exposes only booleans/ages (no data, no counts of users, no
 * internals) so the cloud sentinel routine — and anything else — can check
 * system health without credentials. The alerting/remediation layers live
 * elsewhere: /api/cron/health-sentinel (server, pushes owner alerts) and the
 * claude.ai sentinel routine (diagnoses + safe remediation).
 */
export async function GET() {
  const checks: Record<string, boolean> = {};
  const meta: Record<string, unknown> = {};

  // 1. Editorial engine heartbeat: the news feed should never be silent for
  //    more than ~18h (3 runs/day). This is exactly the failure that went
  //    unnoticed for 5 days in Aug 2026.
  try {
    const { data } = await getSupabaseAdmin()
      .from("app_news")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    const last = data?.[0]?.created_at ? new Date(data[0].created_at) : null;
    const ageHours = last
      ? (Date.now() - last.getTime()) / 3_600_000
      : Infinity;
    checks.news_fresh = ageHours < 18;
    meta.news_age_hours = Number.isFinite(ageHours)
      ? Math.round(ageHours * 10) / 10
      : null;
  } catch {
    checks.news_fresh = false;
  }

  // 2. OG share images (broke silently via a satori bump in Jul 2026).
  try {
    const res = await fetch("https://vectorialdata.com/api/og/portfolio", {
      method: "GET",
      cache: "no-store",
    });
    checks.og_images = res.ok;
  } catch {
    checks.og_images = false;
  }

  // 3. Core public API surface.
  try {
    const res = await fetch(
      "https://vectorialdata.com/api/portfolio/snapshot",
      { cache: "no-store" }
    );
    checks.core_api = res.ok;
  } catch {
    checks.core_api = false;
  }

  const ok = Object.values(checks).every(Boolean);
  return NextResponse.json({
    ok,
    checks,
    meta,
    checked_at: new Date().toISOString(),
  });
}
