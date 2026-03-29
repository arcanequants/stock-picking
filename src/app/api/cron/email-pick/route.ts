import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { sendPickApprovalEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ADMIN_EMAIL = "0138078@up.edu.mx";

export function generatePickApprovalToken(pickNumber: number): string {
  const secret = process.env.RESEND_API_KEY;
  if (!secret) throw new Error("RESEND_API_KEY not configured");
  return crypto
    .createHmac("sha256", secret)
    .update(`pick-${pickNumber}`)
    .digest("hex");
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Accept ?pick=N or default to latest transaction
    const { searchParams } = new URL(request.url);
    const pickParam = searchParams.get("pick");
    const pickNumber = pickParam
      ? parseInt(pickParam, 10)
      : transactions[transactions.length - 1]?.id;

    if (!pickNumber) {
      return NextResponse.json(
        { error: "No transactions found" },
        { status: 400 }
      );
    }

    // Find the transaction and stock
    const tx = transactions.find((t) => t.id === pickNumber);
    if (!tx) {
      return NextResponse.json(
        { error: `Pick #${pickNumber} not found` },
        { status: 404 }
      );
    }

    const stock = stocks.find((s) => s.ticker === tx.ticker);
    if (!stock) {
      return NextResponse.json(
        { error: `Stock ${tx.ticker} not found` },
        { status: 404 }
      );
    }

    // Check if already sent
    const supabase = getSupabaseAdmin();
    const { data: alreadySent } = await supabase
      .from("email_pick_log")
      .select("user_email")
      .eq("pick_number", pickNumber)
      .limit(1);

    if (alreadySent && alreadySent.length > 0) {
      return NextResponse.json({
        message: `Pick #${pickNumber} already sent`,
        pick_number: pickNumber,
      });
    }

    // Count email subscribers (delivery_channel = 'email' or 'both')
    const { data: emailSubs } = await supabase
      .from("subscribers")
      .select("email")
      .in("subscription_status", ["active", "trialing"])
      .in("delivery_channel", ["email", "both"]);

    const recipientCount = (emailSubs ?? []).length;

    // Generate HMAC approval token
    const token = generatePickApprovalToken(pickNumber);
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.vectorialdata.com";
    const approveUrl = `${baseUrl}/api/cron/email-pick/approve?pick=${pickNumber}&token=${token}`;

    // Send preview to admin
    await sendPickApprovalEmail(
      ADMIN_EMAIL,
      stock,
      pickNumber,
      tx,
      approveUrl,
      recipientCount
    );

    return NextResponse.json({
      success: true,
      preview_sent_to: ADMIN_EMAIL,
      pick_number: pickNumber,
      ticker: tx.ticker,
      type: tx.type,
      recipient_count: recipientCount,
    });
  } catch (error) {
    console.error("Email pick cron error:", error);
    return NextResponse.json(
      { error: "Failed to send pick preview" },
      { status: 500 }
    );
  }
}
