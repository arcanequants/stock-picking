import { NextResponse } from "next/server";
import { getAuthState } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendSupportTicketToAdmin, sendSupportTicketAck } from "@/lib/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

const ADMIN_EMAIL = "0138078@up.edu.mx";
const ALLOWED_CATEGORIES = ["billing", "delivery", "feature", "other"] as const;
const MAX_MESSAGE_LENGTH = 4000;
const MIN_MESSAGE_LENGTH = 5;

export async function POST(request: Request) {
  const { user } = await getAuthState();
  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { category?: string; message?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (message.length < MIN_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "message_too_short" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "message_too_long" }, { status: 400 });
  }

  const category =
    body.category && ALLOWED_CATEGORIES.includes(body.category as typeof ALLOWED_CATEGORIES[number])
      ? body.category
      : null;

  const locale = body.locale && /^[a-z]{2}$/i.test(body.locale) ? body.locale.toLowerCase() : "es";

  const supabase = getSupabaseAdmin();

  const { data: recent } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .gte("created_at", new Date(Date.now() - 60 * 1000).toISOString())
    .limit(1);
  if (recent && recent.length > 0) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("support_tickets")
    .insert({
      email: user.email.toLowerCase(),
      category,
      message,
      status: "open",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("Failed to insert support ticket:", insertError);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  try {
    await sendSupportTicketToAdmin(ADMIN_EMAIL, user.email, category, message, inserted.id);
  } catch (err) {
    console.error("Failed to email admin ticket:", err);
  }

  try {
    await sendSupportTicketAck(user.email, inserted.id, locale);
  } catch (err) {
    console.error("Failed to send ticket ack:", err);
  }

  return NextResponse.json({ success: true, ticket_id: inserted.id });
}
