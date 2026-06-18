"use client";

import { useState } from "react";
import { type TopUpPack, MIN_TOPUP_USDC } from "@/lib/api-credit-packs";

type KeyRow = {
  id: string;
  name: string | null;
  key_preview: string | null;
  balance_micro: number;
  last_used_at: string | null;
  created_at: string;
};

type LedgerRow = {
  id: string;
  delta_micro: number;
  source: string;
  endpoint: string | null;
  notes: string | null;
  created_at: string;
};

/** micro-USDC → "X.XXXX USDC". Up to 6 decimals so per-request debits stay visible. */
function fmtUsdc(micro: number): string {
  const usdc = micro / 1_000_000;
  return `${usdc.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })} USDC`;
}

export default function ApiKeysClient({
  initialKeys,
  initialLedger,
  packs,
}: {
  initialKeys: KeyRow[];
  initialLedger: LedgerRow[];
  packs: TopUpPack[];
}) {
  const [keys, setKeys] = useState<KeyRow[]>(initialKeys);
  const [newKeyName, setNewKeyName] = useState("");
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toppingUp, setToppingUp] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    setJustCreated(null);
    setCreating(true);
    try {
      const res = await fetch("/api/account/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setJustCreated(json.data.api_key);
      setNewKeyName("");
      // Refresh key list (server-rendered values are stale post-creation)
      const list = await fetch("/api/account/api-keys").then((r) => r.json());
      setKeys(list.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function handleTopup(packId: string, apiKeyId: string) {
    setError(null);
    setToppingUp(packId);
    try {
      const res = await fetch("/api/billing/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pack_id: packId, api_key_id: apiKeyId }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Failed");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start top-up");
      setToppingUp(null);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this key? Existing integrations will start failing.")) return;
    setRevoking(id);
    try {
      const res = await fetch(`/api/account/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke");
    } finally {
      setRevoking(null);
    }
  }

  // Top-up buttons act on the first (or only) key. Multi-key UX comes later.
  const primaryKey = keys[0] ?? null;

  return (
    <div className="space-y-8">
      {error && (
        <div className="border border-red-500/40 bg-red-500/10 text-red-300 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Create / show new key */}
      <section className="border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Create API key</h2>
        <p className="text-sm text-text-muted">
          New keys start with a $0.20 USDC free trial balance. Save the key immediately — it's only shown once.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Key name (optional)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm"
            disabled={creating}
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create key"}
          </button>
        </div>

        {justCreated && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm font-semibold text-amber-200 mb-2">
              Save this key now — it will not be shown again.
            </p>
            <code className="block break-all text-xs font-mono bg-black/40 text-amber-100 px-3 py-2 rounded">
              {justCreated}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(justCreated)}
              className="mt-2 text-xs text-amber-200 hover:underline"
            >
              Copy to clipboard
            </button>
          </div>
        )}
      </section>

      {/* Key list */}
      <section className="border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Your keys</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-text-muted">No active keys. Create one above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {keys.map((k) => (
              <li key={k.id} className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-mono text-sm text-foreground truncate">
                    {k.key_preview ?? "(legacy)"} {k.name && <span className="text-text-muted">· {k.name}</span>}
                  </div>
                  <div className="text-xs text-text-muted">
                    {fmtUsdc(k.balance_micro)} ·{" "}
                    {k.last_used_at
                      ? `last used ${new Date(k.last_used_at).toLocaleDateString()}`
                      : "never used"}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(k.id)}
                  disabled={revoking === k.id}
                  className="text-xs text-red-400 hover:underline disabled:opacity-50 shrink-0"
                >
                  {revoking === k.id ? "Revoking…" : "Revoke"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Top-up packs */}
      <section className="border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Add balance</h2>
        {!primaryKey ? (
          <p className="text-sm text-text-muted">Create a key first, then come back to top up.</p>
        ) : (
          <>
            <p className="text-sm text-text-muted">
              USDC balance is added to <span className="font-mono">{primaryKey.key_preview}</span> via Stripe Checkout. Minimum top-up is {MIN_TOPUP_USDC} USDC.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {packs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleTopup(p.id, primaryKey.id)}
                  disabled={toppingUp !== null}
                  className="border border-border rounded-xl p-4 hover:border-brand transition-colors text-left disabled:opacity-50"
                >
                  <div className="text-xs uppercase tracking-wide text-text-muted">{p.label}</div>
                  <div className="mt-1 text-2xl font-bold">${(p.priceUsdCents / 100).toFixed(0)}</div>
                  <div className="text-sm text-text-muted">+{(p.priceUsdCents / 100).toFixed(2)} USDC balance</div>
                  {toppingUp === p.id && <div className="mt-2 text-xs text-brand">Opening Stripe…</div>}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Recent activity */}
      <section className="border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Recent activity</h2>
        {initialLedger.length === 0 ? (
          <p className="text-sm text-text-muted">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {initialLedger.map((l) => {
              const positive = l.delta_micro > 0;
              return (
                <li key={l.id} className="py-2 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-foreground truncate">
                      <span className="text-text-muted">{l.source}</span>
                      {l.endpoint && <span className="ml-2 font-mono text-xs">{l.endpoint}</span>}
                      {l.notes && <span className="ml-2 text-xs text-text-muted">· {l.notes}</span>}
                    </div>
                    <div className="text-xs text-text-muted">{new Date(l.created_at).toLocaleString()}</div>
                  </div>
                  <div
                    className={`font-mono text-sm shrink-0 ${
                      positive ? "text-emerald-400" : "text-text-muted"
                    }`}
                  >
                    {positive ? "+" : "−"}
                    {fmtUsdc(Math.abs(l.delta_micro))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
