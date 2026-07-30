import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/device-credential
 *
 * Issues a long-lived device credential for Face ID / Touch ID re-login.
 * Bearer-authed — called by the iOS app right after a successful sign-in.
 * The app stores the raw token in the Keychain behind biometrics; we only
 * persist its SHA-256 hash. The exchange happens at /api/auth/device-login.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthedUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(raw).digest("hex");

    const { error } = await getSupabaseAdmin()
      .from("device_credentials")
      .insert({ email: user.email.toLowerCase(), token_hash: hash });
    if (error) throw error;

    return NextResponse.json({ device_token: raw });
  } catch (err) {
    console.error("device-credential error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
