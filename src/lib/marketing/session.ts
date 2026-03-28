import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { MarketingSession } from "./types";

const SESSION_COOKIE = "marketing_session";
const SESSION_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(adminId: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await supabase.from("marketing_sessions").insert({
    admin_id: adminId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  return token;
}

export async function verifySession(): Promise<MarketingSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const supabase = getSupabaseAdmin();

  const { data: session } = await supabase
    .from("marketing_sessions")
    .select(
      "admin_id, expires_at, marketing_admins!inner(id, username, display_name)"
    )
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!session) return null;

  const admin = session.marketing_admins as unknown as {
    id: string;
    username: string;
    display_name: string | null;
  };

  return {
    adminId: admin.id,
    username: admin.username,
    displayName: admin.display_name,
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    const supabase = getSupabaseAdmin();
    await supabase
      .from("marketing_sessions")
      .delete()
      .eq("token_hash", tokenHash);
  }

  cookieStore.delete(SESSION_COOKIE);
}
