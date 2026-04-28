import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { sendPickApprovalEmail } from "@/lib/resend";
import { generatePickApprovalToken } from "../../cron/email-pick/route";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ADMIN_EMAIL = "0138078@up.edu.mx";

export async function POST(request: Request) {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "VERCEL_WEBHOOK_SECRET not configured" },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-vercel-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const expected = crypto
    .createHmac("sha1", secret)
    .update(rawBody)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    type?: string;
    payload?: { target?: string | null };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type !== "deployment.succeeded") {
    return NextResponse.json({ skipped: "not a succeeded event" });
  }
  if (event.payload?.target !== "production") {
    return NextResponse.json({ skipped: "not production" });
  }

  const supabase = getSupabaseAdmin();

  const [{ data: previewLog }, { data: sentLog }] = await Promise.all([
    supabase.from("email_pick_preview_log").select("pick_number"),
    supabase.from("email_pick_log").select("pick_number"),
  ]);
  const processed = new Set<number>([
    ...(previewLog ?? []).map((r) => r.pick_number as number),
    ...(sentLog ?? []).map((r) => r.pick_number as number),
  ]);

  // Process every transaction in the last 7 days that hasn't received a
  // preview yet. Prevents historical deploys from re-firing old picks while
  // covering same-day multi-pick deploys (e.g. CP + CRM in one push).
  const cutoffMs = Date.now() - 7 * 86400 * 1000;
  const pending = transactions.filter(
    (tx) =>
      !processed.has(tx.id) && new Date(tx.date).getTime() >= cutoffMs
  );

  if (pending.length === 0) {
    return NextResponse.json({ skipped: "no pending picks" });
  }

  const { data: emailSubs } = await supabase
    .from("subscribers")
    .select("email")
    .in("subscription_status", ["active", "trialing"])
    .in("delivery_channel", ["email", "both"]);
  const recipientCount = (emailSubs ?? []).length;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.vectorialdata.com";

  const sent: Array<{ pick_number: number; ticker: string }> = [];
  const errors: Array<{ pick_number: number; error: string }> = [];

  for (const tx of pending) {
    const stock = stocks.find((s) => s.ticker === tx.ticker);
    if (!stock) {
      errors.push({ pick_number: tx.id, error: `stock ${tx.ticker} not found` });
      continue;
    }
    try {
      const token = generatePickApprovalToken(tx.id);
      const approveUrl = `${baseUrl}/api/cron/email-pick/approve?pick=${tx.id}&token=${token}`;
      await sendPickApprovalEmail(
        ADMIN_EMAIL,
        stock,
        tx.id,
        tx,
        approveUrl,
        recipientCount
      );
      const { error: insertError } = await supabase
        .from("email_pick_preview_log")
        .insert({ pick_number: tx.id });
      if (insertError && insertError.code !== "23505") {
        console.error("Failed to log preview:", insertError);
      }
      sent.push({ pick_number: tx.id, ticker: tx.ticker });
    } catch (e) {
      errors.push({ pick_number: tx.id, error: (e as Error).message });
    }
  }

  return NextResponse.json({
    success: true,
    preview_sent_to: ADMIN_EMAIL,
    sent,
    errors,
    recipient_count: recipientCount,
  });
}
