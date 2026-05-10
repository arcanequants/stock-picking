import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendTicketReplyToUser } from "@/lib/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

const MAX_BODY_LENGTH = 10000;
const MIN_BODY_LENGTH = 1;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let payload: { body?: string; close?: boolean; locale?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const body = (payload.body ?? "").trim();
  if (body.length < MIN_BODY_LENGTH) {
    return NextResponse.json({ error: "body_too_short" }, { status: 400 });
  }
  if (body.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: "body_too_long" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, email")
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error: insertError } = await supabase
    .from("support_ticket_messages")
    .insert({
      ticket_id: ticketId,
      sender_type: "admin",
      sender_email: admin.email,
      body,
    });

  if (insertError) {
    console.error("Failed to insert admin reply:", insertError);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  const newStatus = payload.close ? "closed" : "open";
  await supabase
    .from("support_tickets")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  const locale = payload.locale && /^[a-z]{2}$/i.test(payload.locale)
    ? payload.locale.toLowerCase()
    : "es";

  try {
    await sendTicketReplyToUser(ticket.email, ticketId, body, locale);
  } catch (err) {
    console.error("Failed to email user reply notification:", err);
  }

  return NextResponse.json({ success: true });
}
