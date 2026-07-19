"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

/**
 * Account module: view/edit the per-buy amount (subscribers.default_investment)
 * that pre-fills the "La compré" sheet on /picks. Mirrors iOS "Monto por compra".
 * Also hosts the "Ver tutorial" replay link.
 */
export default function InvestmentAmountModule() {
  const t = useTranslations("Onboarding");
  const [amount, setAmount] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j.default_investment === "number") setAmount(j.default_investment);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    const parsed = parseFloat(draft);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/me/default-investment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: parsed }),
      });
      if (res.ok) {
        setAmount(parsed);
        setEditing(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-text-muted">{t("moduleCurrentLabel")}</p>
          <p className="text-xl font-bold font-mono">
            {!loaded ? "…" : amount != null ? `$${amount}` : t("moduleUnset")}
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => {
              setDraft(amount != null ? String(amount) : "");
              setEditing(true);
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-card-hover transition-colors"
          >
            {t("moduleEdit")}
          </button>
        )}
      </div>

      {editing && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="any"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              className="w-32 rounded-lg border border-border bg-transparent pl-7 pr-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
          >
            {busy ? "…" : t("moduleSave")}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-text-faint hover:text-text-muted transition-colors"
          >
            {t("moduleCancel")}
          </button>
        </div>
      )}

      <p className="text-xs text-text-faint">{t("moduleHint")}</p>

      <div className="border-t border-border pt-3">
        <Link href="/picks?onboarding=1" className="text-sm text-brand hover:text-brand-hover transition-colors">
          {t("moduleReplayTutorial")} {"→"}
        </Link>
      </div>
    </div>
  );
}
