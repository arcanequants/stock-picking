import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendMagicLinkEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { session_id, locale } = await request.json();

    if (!session_id || typeof session_id !== "string") {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    // 1. Verify with Stripe that this checkout session is real
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

    // 2. Generate a magic link via Supabase Admin
    const supabase = getSupabaseAdmin();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "https://www.vectorialdata.com");

    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=/portfolio`,
        },
      });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Failed to generate magic link:", linkError);
      return NextResponse.json(
        { error: "Failed to generate login link" },
        { status: 500 }
      );
    }

    // 3. Send branded email via Resend
    await sendMagicLinkEmail(
      normalizedEmail,
      linkData.properties.action_link,
      locale || "es"
    );

    // 4. Return masked email
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
