import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase";
import { TOPUP_PACKS } from "@/lib/api-credit-packs";
import ApiKeysClient from "./ApiKeysClient";

export const metadata: Metadata = {
  title: "API Keys — Vectorial Data",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://vectorialdata.com/api-keys" },
};

export const dynamic = "force-dynamic";

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string; pack?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/api-keys");

  const admin = getSupabaseAdmin();

  const { data: keys } = await admin
    .from("api_keys")
    .select("id, name, key, balance_micro, last_used_at, created_at")
    .eq("account_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  const { data: ledger } = await admin
    .from("api_credit_ledger")
    .select("id, delta_micro, source, endpoint, notes, created_at")
    .eq("account_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const initialKeys =
    (keys ?? []).map((k) => ({
      id: k.id,
      name: k.name as string | null,
      key_preview: k.key ? `vd_live_…${(k.key as string).slice(-6)}` : null,
      balance_micro: k.balance_micro as number,
      last_used_at: k.last_used_at as string | null,
      created_at: k.created_at as string,
    }));

  const initialLedger =
    (ledger ?? []).map((l) => ({
      id: l.id as string,
      delta_micro: l.delta_micro as number,
      source: l.source as string,
      endpoint: l.endpoint as string | null,
      notes: l.notes as string | null,
      created_at: l.created_at as string,
    }));

  const sp = await searchParams;
  const flash =
    sp.topup === "success"
      ? `Top-up complete — balance arriving in seconds (Stripe webhook).`
      : sp.topup === "cancel"
        ? `Top-up canceled. No charge.`
        : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <header>
        <h1 className="text-3xl font-bold mb-2">API Keys</h1>
        <p className="text-text-muted">
          Manage your Vectorial Data API keys and prepaid USDC balance. You pay per request in USDC.
        </p>
      </header>

      {flash && (
        <div className="border border-border rounded-xl px-4 py-3 text-sm bg-card">
          {flash}
        </div>
      )}

      <ApiKeysClient
        initialKeys={initialKeys}
        initialLedger={initialLedger}
        packs={Object.values(TOPUP_PACKS)}
      />
    </div>
  );
}
