import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";
import { NEWS_REGIONS, NEWS_TOPICS } from "@/lib/news-classify";

export const dynamic = "force-dynamic";

/**
 * GET  /api/news/prefs — the user's news mix (topics / regions / delivery).
 * PUT  /api/news/prefs — update it. Body: { topics?, regions?, delivery? }.
 *
 * No row = defaults (everything on, instant) — same contract the push
 * fan-out assumes, so a user who never opens the screen loses nothing.
 * 'picks' is not a toggle (always on) and 'global' region is always on;
 * both are enforced server-side no matter what the client sends.
 */

const TOGGLABLE_TOPICS = NEWS_TOPICS.filter((t) => t !== "picks");
const TOGGLABLE_REGIONS = NEWS_REGIONS.filter((r) => r !== "global");
const DELIVERIES = ["instant", "daily", "none"] as const;

const DEFAULT_PREFS = {
  topics: [...TOGGLABLE_TOPICS],
  regions: [...TOGGLABLE_REGIONS],
  delivery: "instant" as (typeof DELIVERIES)[number],
};

export async function GET(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data: row } = await admin
    .from("user_news_prefs")
    .select("topics, regions, delivery")
    .eq("email", authed.email)
    .maybeSingle();

  return NextResponse.json({ prefs: row ?? DEFAULT_PREFS });
}

export async function PUT(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { topics?: unknown; regions?: unknown; delivery?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const topics = Array.isArray(body.topics)
    ? [
        ...new Set(
          body.topics.filter(
            (t): t is string =>
              typeof t === "string" &&
              (TOGGLABLE_TOPICS as readonly string[]).includes(t),
          ),
        ),
      ]
    : DEFAULT_PREFS.topics;

  const regions = Array.isArray(body.regions)
    ? [
        ...new Set(
          body.regions.filter(
            (r): r is string =>
              typeof r === "string" &&
              (TOGGLABLE_REGIONS as readonly string[]).includes(r),
          ),
        ),
      ]
    : DEFAULT_PREFS.regions;

  const delivery = DELIVERIES.includes(body.delivery as never)
    ? (body.delivery as (typeof DELIVERIES)[number])
    : "instant";

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("user_news_prefs").upsert(
    {
      email: authed.email,
      topics,
      regions,
      delivery,
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("Failed to upsert user_news_prefs:", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, prefs: { topics, regions, delivery } });
}
