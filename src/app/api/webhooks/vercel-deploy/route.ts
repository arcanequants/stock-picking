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

  const pickNumber = transactions[transactions.length - 1]?.id;
  if (!pickNumber) {
    return NextResponse.json({ skipped: "no transactions" });
  }

  const tx = transactions.find((t) => t.id === pickNumber);
  const stock = tx ? stocks.find((s) => s.ticker === tx.ticker) : null;
  if (!tx || !stock) {
    return NextResponse.json({ skipped: "pick or stock not found" });
  }

  const supabase = getSupabaseAdmin();

  const { data: alreadySent } = await supabase
    .from("email_pick_log")
    .select("pick_number")
    .eq("pick_number", pickNumber)
    .limit(1);
  if (alreadySent && alreadySent.length > 0) {
    return NextResponse.json({
      skipped: `pick #${pickNumber} already approved & sent`,
    });
  }

  const { data: previewSent } = await supabase
    .from("email_pick_preview_log")
    .select("pick_number")
    .eq("pick_number", pickNumber)
    .limit(1);
  if (previewSent && previewSent.length > 0) {
    return NextResponse.json({
      skipped: `preview for pick #${pickNumber} already sent`,
    });
  }

  const { data: emailSubs } = await supabase
    .from("subscribers")
    .select("email")
    .in("subscription_status", ["active", "trialing"])
    .in("delivery_channel", ["email", "both"]);
  const recipientCount = (emailSubs ?? []).length;

  const token = generatePickApprovalToken(pickNumber);
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.vectorialdata.com";
  const approveUrl = `${baseUrl}/api/cron/email-pick/approve?pick=${pickNumber}&token=${token}`;

  await sendPickApprovalEmail(
    ADMIN_EMAIL,
    stock,
    pickNumber,
    tx,
    approveUrl,
    recipientCount
  );

  const { error: insertError } = await supabase
    .from("email_pick_preview_log")
    .insert({ pick_number: pickNumber });
  if (insertError && insertError.code !== "23505") {
    console.error("Failed to log preview:", insertError);
  }

  return NextResponse.json({
    success: true,
    preview_sent_to: ADMIN_EMAIL,
    pick_number: pickNumber,
    ticker: tx.ticker,
    recipient_count: recipientCount,
  });
}
