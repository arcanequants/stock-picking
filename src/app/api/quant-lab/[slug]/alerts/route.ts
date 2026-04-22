import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getBot } from "@/lib/quant-lab";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const bot = await getBot(slug);
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    source?: string;
  };
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("quant_lab_alert_subscribers")
    .upsert(
      {
        bot_id: bot.id,
        email,
        source: body.source ?? null,
        unsubscribed_at: null,
        subscribed_at: new Date().toISOString(),
      },
      { onConflict: "bot_id,email" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
