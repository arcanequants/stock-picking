import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendMagicLinkEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { email, locale, client, next } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Missing email" },
        { status: 400 }
      );
    }

    const isIOSClient = client === "ios";

    // Whitelist next paths that the email link is allowed to land on.
    // Prevents open-redirect via crafted next values.
    const SAFE_NEXT_PREFIXES = ["/account", "/portfolio", "/metodo", "/welcome"];
    const safeNext: string =
      typeof next === "string" &&
      next.startsWith("/") &&
      SAFE_NEXT_PREFIXES.some((p) => next === p || next.startsWith(p + "/"))
        ? next
        : "/portfolio";

    const normalizedEmail = email.toLowerCase().trim();

    // Generate a magic link via Supabase Admin (does NOT send any email)
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

    // Extract token_hash from Supabase's action_link and build our own URL.
    // Supabase's action_link goes to their /auth/v1/verify endpoint which
    // redirects with PKCE code — but no code_verifier exists in the browser,
    // so exchangeCodeForSession always fails. Instead, we link directly to
    // our callback with the token_hash so we can call verifyOtp() ourselves.
    const actionUrl = new URL(linkData.properties.action_link);
    const tokenHash = actionUrl.searchParams.get("token");
    const type = actionUrl.searchParams.get("type") || "magiclink";

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "https://www.vectorialdata.com");

    const callbackUrl = isIOSClient
      ? `vectorialdata://auth?token_hash=${tokenHash}&type=${type}`
      : `${siteUrl}/auth/callback?token_hash=${tokenHash}&type=${type}&next=${encodeURIComponent(safeNext)}`;

    // Dev fallback: when RESEND_API_KEY isn't configured (local dev), skip
    // the email send and return the link directly so the developer can open it.
    // Production always has the key, so this branch is strictly a dev convenience.
    if (!process.env.RESEND_API_KEY) {
      console.log("[magic-link] dev mode — link:", callbackUrl);
      return NextResponse.json({ ok: true, dev_link: callbackUrl });
    }

    await sendMagicLinkEmail(normalizedEmail, callbackUrl, locale || "es");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Magic link error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
