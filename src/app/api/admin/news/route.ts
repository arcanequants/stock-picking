import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendNewsPush } from "@/lib/news-push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/admin/news — publish a curated mobile news item.
 *
 * Bearer auth via `ADMIN_NEWS_TOKEN`. Inserts the row, then fans out an
 * APNs push to every active device matching `audience`. Returns delivery
 * counts so the CLI can echo them in Terminal.
 *
 * App-only — the website intentionally has no equivalent surface.
 */
function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function checkToken(request: Request): boolean {
  const expected = process.env.ADMIN_NEWS_TOKEN?.trim();
  if (!expected) return false;
  const header = (request.headers.get("authorization") ?? "").trim();
  return header === `Bearer ${expected}`;
}

export async function POST(request: Request) {
  if (!checkToken(request)) return unauthorized();

  let body: {
    headline?: string;
    body?: string;
    link_url?: string | null;
    audience?: "all" | "premium";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const headline = (body.headline ?? "").trim();
  const newsBody = (body.body ?? "").trim();
  const linkUrl = body.link_url?.trim() || null;
  const audience = body.audience ?? "all";

  if (headline.length < 1 || headline.length > 80) {
    return NextResponse.json({ error: "invalid_headline" }, { status: 400 });
  }
  if (newsBody.length < 1 || newsBody.length > 4000) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (audience !== "all" && audience !== "premium") {
    return NextResponse.json({ error: "invalid_audience" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: inserted, error } = await admin
    .from("app_news")
    .insert({
      headline,
      body: newsBody,
      link_url: linkUrl,
      audience,
    })
    .select("id, headline, body, link_url, audience, published_at")
    .single();

  if (error || !inserted) {
    console.error("Failed to insert app_news:", error);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  const delivery = await sendNewsPush({
    id: inserted.id,
    headline: inserted.headline,
    body: inserted.body,
    audience: inserted.audience as "all" | "premium",
  });

  await admin
    .from("app_news")
    .update({
      push_sent_at: new Date().toISOString(),
      push_sent_count: delivery.sent,
    })
    .eq("id", inserted.id);

  return NextResponse.json({
    ok: true,
    news: inserted,
    delivery,
  });
}
