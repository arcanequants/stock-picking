import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendMagicLinkEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { email, locale } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Missing email" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate a magic link via Supabase Admin (does NOT send any email)
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

    // Send branded email via Resend (not Supabase)
    await sendMagicLinkEmail(
      normalizedEmail,
      linkData.properties.action_link,
      locale || "es"
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Magic link error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
