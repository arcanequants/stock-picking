import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// DELETE — revoke a key (soft-delete). Keeps ledger history + billing trail intact.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await getSupabaseAdmin()
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("account_id", user.id)
    .is("revoked_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
