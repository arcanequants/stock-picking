import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { sendPickEmail } from "@/lib/resend";
import { sendAPNsMany } from "@/lib/apns";
import { generatePickApprovalToken } from "../route";

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
  const pickParam = searchParams.get("pick");
  const token = searchParams.get("token");

  if (!pickParam || !token) {
    return htmlResponse("Error", "Faltan parametros (pick, token).", "#ef4444");
  }

  const pickNumber = parseInt(pickParam, 10);
  if (isNaN(pickNumber)) {
    return htmlResponse("Error", "Pick number invalido.", "#ef4444");
  }

  // Verify HMAC token
  let expectedToken: string;
  try {
    expectedToken = generatePickApprovalToken(pickNumber);
  } catch {
    return htmlResponse("Error", "RESEND_API_KEY no configurada.", "#ef4444");
  }

  const tokenBuffer = Buffer.from(token, "hex");
  const expectedBuffer = Buffer.from(expectedToken, "hex");

  if (
    tokenBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)
  ) {
    return htmlResponse(
      "Token invalido",
      "El enlace de aprobacion no es valido o ha expirado.",
      "#ef4444"
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
    return htmlResponse(
      "Ya enviado",
      `El pick #${pickNumber} ya fue enviado anteriormente.`,
      "#f59e0b"
    );
  }

  try {
    // Find the transaction and stock
    const tx = transactions.find((t) => t.id === pickNumber);
    if (!tx) {
      return htmlResponse(
        "Error",
        `Pick #${pickNumber} no encontrado en transactions.`,
        "#ef4444"
      );
    }

    const stock = stocks.find((s) => s.ticker === tx.ticker);
    if (!stock) {
      return htmlResponse(
        "Error",
        `Stock ${tx.ticker} no encontrado.`,
        "#ef4444"
      );
    }

    // Get email subscribers (delivery_channel = 'email' or 'both', active/trialing)
    const { data: emailSubs } = await supabase
      .from("subscribers")
      .select("email, subscription_status")
      .in("subscription_status", ["active", "trialing"])
      .in("delivery_channel", ["email", "both"]);

    const recipients = emailSubs ?? [];

    if (recipients.length === 0) {
      return htmlResponse(
        "Sin destinatarios",
        `No hay suscriptores con entrega por email para el pick #${pickNumber}.`,
        "#f59e0b"
      );
    }

    // Send pick email to each subscriber
    let sent = 0;
    let failed = 0;

    for (const sub of recipients) {
      try {
        await sendPickEmail(sub.email, stock, pickNumber, tx);

        await supabase.from("email_pick_log").insert({
          pick_number: pickNumber,
          user_email: sub.email.toLowerCase(),
        });

        sent++;
      } catch (e) {
        console.error(`Failed to send pick to ${sub.email}:`, e);
        failed++;
      }
    }

    // iOS push fanout — best-effort, does not block email delivery summary.
    let pushSent = 0;
    let pushFailed = 0;
    try {
      const subscribedEmails = recipients.map((r) => r.email.toLowerCase());
      if (subscribedEmails.length > 0 && process.env.APNS_TEAM_ID) {
        const { data: tokens } = await supabase
          .from("device_tokens")
          .select("email, token")
          .eq("platform", "ios")
          .eq("is_active", true)
          .in("email", subscribedEmails);

        const tokenList = (tokens ?? []).map((t) => t.token);
        if (tokenList.length > 0) {
          const returnPct = tx.price > 0
            ? Math.round(((stock.price - tx.price) / tx.price) * 10000) / 100
            : 0;
          const results = await sendAPNsMany(tokenList, {
            aps: {
              alert: {
                title: `Pick #${pickNumber}: ${stock.ticker}`,
                body: stock.name,
              },
              sound: "default",
              "thread-id": "new-pick",
            },
            ticker: stock.ticker,
            pick_number: pickNumber,
            return_pct: returnPct,
            kind: "new_pick",
          });

          // Deactivate tokens Apple rejects as dead (410).
          const deadTokens = results
            .filter((r) => r.status === 410 || r.reason === "Unregistered")
            .map((r) => r.token);
          if (deadTokens.length > 0) {
            await supabase
              .from("device_tokens")
              .update({ is_active: false })
              .in("token", deadTokens);
          }

          pushSent = results.filter((r) => r.ok).length;
          pushFailed = results.length - pushSent;
        }
      }
    } catch (e) {
      console.error("APNs fanout failed (non-fatal):", e);
    }

    return htmlResponse(
      "Pick enviado",
      `Pick #${pickNumber} (${stock.name}): ${sent} emails, ${pushSent} pushes.${failed + pushFailed > 0 ? ` Fallaron ${failed} emails y ${pushFailed} pushes.` : ""}`,
      "#16a34a"
    );
  } catch (error) {
    console.error("Approve pick error:", error);
    return htmlResponse(
      "Error",
      "Hubo un error al enviar el pick. Revisa los logs.",
      "#ef4444"
    );
  }
}
