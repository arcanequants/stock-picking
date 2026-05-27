import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/news/[id] — edit an existing news item (typo fix, copy
 * polish). Does NOT re-fire the push.
 *
 * DELETE /api/admin/news/[id] — hard delete. There's nothing to preserve
 * here — these rows are editorial, not transactional.
 *
 * Both require Bearer ADMIN_NEWS_TOKEN.
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkToken(request)) return unauthorized();
  const { id } = await params;

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

  const patch: Record<string, unknown> = {};
  if (body.headline !== undefined) {
    const h = body.headline.trim();
    if (h.length < 1 || h.length > 80) {
      return NextResponse.json({ error: "invalid_headline" }, { status: 400 });
    }
    patch.headline = h;
  }
  if (body.body !== undefined) {
    const b = body.body.trim();
    if (b.length < 1 || b.length > 4000) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    patch.body = b;
  }
  if (body.link_url !== undefined) {
    patch.link_url = body.link_url?.trim() || null;
  }
  if (body.audience !== undefined) {
    if (body.audience !== "all" && body.audience !== "premium") {
      return NextResponse.json({ error: "invalid_audience" }, { status: 400 });
    }
    patch.audience = body.audience;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("app_news")
    .update(patch)
    .eq("id", id)
    .select("id, headline, body, link_url, audience, published_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, news: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkToken(request)) return unauthorized();
  const { id } = await params;

  const { error } = await getSupabaseAdmin()
    .from("app_news")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
