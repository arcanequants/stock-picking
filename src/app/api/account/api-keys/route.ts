import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase";
import { createApiKey } from "@/lib/api-keys";

export const dynamic = "force-dynamic";

// GET — list the caller's API keys (with balances + last-used).
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: keys, error } = await getSupabaseAdmin()
    .from("api_keys")
    .select("id, name, key, balance_micro, last_used_at, created_at, revoked_at")
    .eq("account_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mask: return only last 6 chars of plaintext. Full key is shown once at creation.
  const masked = (keys ?? []).map((k) => ({
    id: k.id,
    name: k.name,
    key_preview: k.key ? `vd_live_…${k.key.slice(-6)}` : null,
    balance_micro: k.balance_micro,
    last_used_at: k.last_used_at,
    created_at: k.created_at,
  }));

  return NextResponse.json({ data: masked });
}

// POST — create a new key bound to the caller's account (gets the signup grant).
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { name } = body as { name?: string };

  try {
    const result = await createApiKey({
      account_id: user.id,
      email: user.email ?? undefined,
      name: name?.trim() || undefined,
    });
    return NextResponse.json({
      data: {
        api_key: result.key,
        balance_micro: result.balance_micro,
      },
      meta: {
        message: "Save this key now — it will not be shown again.",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create API key";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
