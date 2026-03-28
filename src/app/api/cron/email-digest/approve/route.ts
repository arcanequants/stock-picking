import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getEventsForDigest } from "@/lib/notifications";
import { sendDigestEmail } from "@/lib/resend";
import { generateApprovalToken } from "../route";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function htmlResponse(title: string, message: string, color: string) {
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:40px 20px;text-align:center;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;padding:32px;">
    <div style="width:48px;height:48px;border-radius:50%;background:${color};margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
      <span style="color:#fff;font-size:24px;">${color === "#16a34a" ? "\u2713" : "\u2717"}</span>
    </div>
    <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">${title}</h1>
    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">${message}</p>
    <a href="https://www.vectorialdata.com" style="display:inline-block;margin-top:20px;font-size:13px;color:#4f46e5;text-decoration:none;">Vectorial Data</a>
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const weekKey = searchParams.get("week");
  const token = searchParams.get("token");

  if (!weekKey || !token) {
    return htmlResponse("Error", "Faltan parametros (week, token).", "#ef4444");
  }

  // Verify HMAC token
  let expectedToken: string;
  try {
    expectedToken = generateApprovalToken(weekKey);
  } catch {
    return htmlResponse("Error", "RESEND_API_KEY no configurada.", "#ef4444");
  }

  const tokenBuffer = Buffer.from(token, "hex");
  const expectedBuffer = Buffer.from(expectedToken, "hex");

  if (
    tokenBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)
  ) {
    return htmlResponse("Token invalido", "El enlace de aprobacion no es valido o ha expirado.", "#ef4444");
  }

  // Check if already sent this week
  const supabaseAdmin = getSupabaseAdmin();
  const { data: alreadySent } = await supabaseAdmin
    .from("email_digest_log")
    .select("user_email")
    .eq("week_key", weekKey)
    .limit(1);

  if (alreadySent && alreadySent.length > 0) {
    return htmlResponse(
      "Ya enviado",
      `El digest de la semana ${weekKey} ya fue enviado anteriormente.`,
      "#f59e0b"
    );
  }

  try {
    // Get events from the past 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const events = await getEventsForDigest(since);

    if (events.length === 0) {
      return htmlResponse("Sin eventos", "No hay eventos esta semana para enviar.", "#f59e0b");
    }

    // Get premium subscribers
    const { data: subscribers } = await supabaseAdmin
      .from("subscribers")
      .select("email, subscription_status")
      .in("subscription_status", ["active", "trialing"]);

    const premiumEmails = new Set(
      (subscribers ?? []).map((s) => s.email.toLowerCase())
    );

    // Get ALL registered users
    const allUsers: { email: string }[] = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const {
        data: { users },
        error,
      } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error || !users?.length) break;
      for (const u of users) {
        if (u.email) allUsers.push({ email: u.email.toLowerCase() });
      }
      if (users.length < perPage) break;
      page++;
    }

    // Deduplicate
    const uniqueRecipients = [
      ...new Map(allUsers.map((u) => [u.email, u])).values(),
    ];

    if (uniqueRecipients.length === 0) {
      return htmlResponse("Sin usuarios", "No hay usuarios registrados.", "#f59e0b");
    }

    // Send digests
    let sent = 0;
    let failed = 0;

    for (const user of uniqueRecipients) {
      try {
        const isPremium = premiumEmails.has(user.email);
        await sendDigestEmail(user.email, events, "es", isPremium);

        await supabaseAdmin
          .from("email_digest_log")
          .insert({ user_email: user.email, week_key: weekKey });

        sent++;
      } catch (e) {
        console.error(`Failed to send digest to ${user.email}:`, e);
        failed++;
      }
    }

    return htmlResponse(
      "Digest enviado",
      `Semana ${weekKey}: ${sent} emails enviados (${premiumEmails.size} premium, ${sent - premiumEmails.size} free).${failed > 0 ? ` ${failed} fallaron.` : ""}`,
      "#16a34a"
    );
  } catch (error) {
    console.error("Approve digest error:", error);
    return htmlResponse("Error", "Hubo un error al enviar el digest. Revisa los logs.", "#ef4444");
  }
}
