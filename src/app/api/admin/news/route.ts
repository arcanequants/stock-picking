import { NextResponse } from "next/server";
import { publishNewsItem, type PublishNewsInput } from "@/lib/news-ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/admin/news — publish a mobile news item.
 *
 * Bearer auth via `ADMIN_NEWS_TOKEN`. The publisher keeps sending plain
 * headline+body; the shared pipeline (lib/news-ingest) enriches at ingest:
 * dedupe gate → classify (topic/regions/tickers + 4-block explainer +
 * glossary) → insert → preference-aware push → translate en/pt/hi.
 * A same-story repeat within 7 days returns 409 `duplicate_story`
 * (`skip_dedupe: true` overrides — manual publisher only).
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

  let body: PublishNewsInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = await publishNewsItem(body);
  if (!result.ok) {
    const { status, ...payload } = result;
    return NextResponse.json(payload, { status });
  }
  return NextResponse.json(result);
}
