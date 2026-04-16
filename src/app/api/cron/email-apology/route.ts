import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { sendPickEmail } from "@/lib/resend";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FROM = "Vectorial Data <notifications@mail.vectorialdata.com>";

function buildApologyHtml(firstName: string, ticker1: string, ticker2: string, ticker3: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:40px 20px;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:600px;background:#fff;border-radius:12px;border:1px solid #e4e4e7;">
    <tr><td style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">Hola ${firstName},</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        Tuvimos un bug: los picks de tu suscripción premium no se estaban entregando por email.
        WhatsApp funcionó perfecto, pero el canal de email se rompió y no nos dimos cuenta a tiempo.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        Ya está arreglado. En los próximos minutos vas a recibir <b>los últimos 3 picks que te debíamos</b>:
        ${ticker1}, ${ticker2}, y ${ticker3}.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
        Como disculpa por el bug, <b>te extendemos tu suscripción 7 días gratis</b>.
        Responde a este email con la palabra "extender" y lo aplicamos a tu cuenta.
      </p>
      <p style="margin:24px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
        Gracias por tu paciencia.<br>
        — Alberto
      </p>
    </td></tr>
    <tr><td style="padding:16px 32px;border-top:1px solid #e4e4e7;font-size:12px;color:#9ca3af;text-align:center;">
      <a href="https://www.vectorialdata.com" style="color:#4f46e5;text-decoration:none;">Vectorial Data</a>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function GET(request: Request) {
  // Auth: CRON_SECRET required
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dry") === "1";

  const supabase = getSupabaseAdmin();

  try {
    // Find all active/trialing subscribers with email or both delivery
    const { data: allEmailSubs, error: subsErr } = await supabase
      .from("subscribers")
      .select("email")
      .in("subscription_status", ["active", "trialing"])
      .in("delivery_channel", ["email", "both"]);

    if (subsErr) {
      console.error("Failed to fetch subscribers:", subsErr);
      return NextResponse.json({ error: "subs_query_failed" }, { status: 500 });
    }

    if (!allEmailSubs || allEmailSubs.length === 0) {
      return NextResponse.json({ message: "No email subscribers", candidates: 0 });
    }

    // Filter out users already apologized to
    const { data: alreadyApologized } = await supabase
      .from("email_apology_log")
      .select("user_email");

    const apologizedSet = new Set(
      (alreadyApologized ?? []).map((r) => r.user_email.toLowerCase())
    );

    const candidates = allEmailSubs
      .map((s) => s.email.toLowerCase())
      .filter((email) => !apologizedSet.has(email));

    if (candidates.length === 0) {
      return NextResponse.json({
        message: "All email subscribers already apologized to",
        candidates: 0,
      });
    }

    // Pick the last 3 transactions
    const last3 = transactions.slice(-3);
    if (last3.length === 0) {
      return NextResponse.json({ error: "No transactions found" }, { status: 400 });
    }

    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        candidates_count: candidates.length,
        candidates: candidates,
        picks_to_send: last3.map((tx) => ({ id: tx.id, ticker: tx.ticker })),
      });
    }

    // Execute: send apology + 3 picks to each candidate
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const [t1, t2, t3] = last3;
    const ticker1 = t1.ticker;
    const ticker2 = t2?.ticker ?? "—";
    const ticker3 = t3?.ticker ?? "—";

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const email of candidates) {
      try {
        // 1. Send apology email
        const firstName = email.split("@")[0].split(".")[0];
        const capitalizedName =
          firstName.charAt(0).toUpperCase() + firstName.slice(1);

        await resend.emails.send({
          from: FROM,
          to: email,
          subject: "Tuvimos un bug — aquí están los picks que te debíamos",
          html: buildApologyHtml(capitalizedName, ticker1, ticker2, ticker3),
          replyTo: "Hello@vectorialdata.com",
        });

        // 2. Send each missing pick (only if not already logged)
        for (const tx of last3) {
          const stock = stocks.find((s) => s.ticker === tx.ticker);
          if (!stock) continue;

          const { data: existing } = await supabase
            .from("email_pick_log")
            .select("id")
            .eq("pick_number", tx.id)
            .eq("user_email", email)
            .limit(1);

          if (existing && existing.length > 0) continue;

          await sendPickEmail(email, stock, tx.id, tx);
          await supabase.from("email_pick_log").insert({
            pick_number: tx.id,
            user_email: email,
          });
        }

        // 3. Mark as apologized
        await supabase.from("email_apology_log").insert({ user_email: email });

        success++;
      } catch (e) {
        failed++;
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${email}: ${msg}`);
        console.error(`Apology to ${email} failed:`, e);
      }
    }

    return NextResponse.json({
      success: true,
      candidates_count: candidates.length,
      sent: success,
      failed,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error("Email apology cron error:", error);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }
}
