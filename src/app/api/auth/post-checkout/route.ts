import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { sendMagicLinkEmail } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase";

// Post-checkout endpoint.
//
// Primary welcome + magic-link email is sent by the Stripe webhook
// (checkout.session.completed). This endpoint exists for the /welcome
// UI to (a) confirm the session is paid and return a masked email
// to display, and (b) resend a magic-link-only email on demand via
// the "Didn't get it?" button.
export async function POST(request: Request) {
  try {
    const { session_id, locale, resend } = await request.json();

    if (!session_id || typeof session_id !== "string") {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    const session = await getStripe().checkout.sessions.retrieve(session_id);
    const email =
      session.customer_details?.email ?? session.customer_email;

    if (!email || session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Invalid or unpaid session" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (resend === true) {
      const supabase = getSupabaseAdmin();
      const { data: linkData, error: linkError } =
        await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: normalizedEmail,
        });

      if (linkError || !linkData?.properties?.action_link) {
        console.error("Failed to generate magic link:", linkError);
        return NextResponse.json(
          { error: "Failed to generate login link" },
          { status: 500 }
        );
      }

      const actionUrl = new URL(linkData.properties.action_link);
      const tokenHash = actionUrl.searchParams.get("token");
      const type = actionUrl.searchParams.get("type") || "magiclink";

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : "https://www.vectorialdata.com");

      const callbackUrl = `${siteUrl}/auth/callback?token_hash=${tokenHash}&type=${type}&next=/portfolio`;

      await sendMagicLinkEmail(normalizedEmail, callbackUrl, locale || "es");
    }

    const [user, domain] = normalizedEmail.split("@");
    const masked =
      user.length <= 2
        ? `${user[0]}***@${domain}`
        : `${user[0]}${user[1]}***@${domain}`;

    return NextResponse.json({ email_masked: masked });
  } catch (err) {
    console.error("Post-checkout error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
