"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface PickItem {
  pick_number: number;
  ticker: string;
  name: string;
  sector: string;
  price_at_pick: number;
  current_price: number;
  return_pct: number;
  date: string;
  type: "new" | "rebuy";
  status: "pending" | "bought" | "skipped";
  buy_price: number | null;
  amount_invested: number | null;
  decided_at: string | null;
}

interface PicksResponse {
  picks: PickItem[];
  is_subscribed: boolean;
  default_investment: number | null;
  access_started_at: string | null;
}

export default function PicksFeed() {
  const t = useTranslations("PicksFeed");
  const [data, setData] = useState<PicksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthed, setUnauthed] = useState(false);
  const [buySheet, setBuySheet] = useState<PickItem | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/picks", { cache: "no-store" });
      if (res.status === 401) {
        setUnauthed(true);
        return;
      }
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(
    pick: PickItem,
    body:
      | { status: "bought"; buy_price: number; amount_invested: number; save_as_default?: boolean }
      | { status: "skipped" },
  ) {
    setBusy(pick.pick_number);
    try {
      const res = await fetch(`/api/picks/${pick.pick_number}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) await load();
    } finally {
      setBusy(null);
      setBuySheet(null);
    }
  }

  async function revert(pick: PickItem) {
    setBusy(pick.pick_number);
    try {
      const res = await fetch(`/api/picks/${pick.pick_number}/decision`, { method: "DELETE" });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-border animate-pulse bg-card-hover/50" />
        ))}
      </div>
    );
  }

  if (unauthed) {
    return (
      <div className="border border-border rounded-xl p-8 text-center space-y-3">
        <p className="font-semibold">{t("loginRequired")}</p>
        <p className="text-sm text-text-muted">{t("loginRequiredDesc")}</p>
        <Link href="/login" className="inline-block rounded-lg bg-brand text-white px-5 py-2 text-sm font-semibold hover:bg-brand-hover transition-colors">
          {t("loginCta")}
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const pending = data.picks.filter((p) => p.status === "pending");
  const decided = data.picks.filter((p) => p.status !== "pending");

  return (
    <div className="space-y-8">
      {!data.is_subscribed && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="font-semibold text-amber-700 dark:text-amber-400">{t("teaserTitle")}</p>
          <p className="mt-1 text-text-muted">
            {t("teaserBody")}{" "}
            <Link href="/join" className="text-brand hover:underline">{t("teaserCta")}</Link>
          </p>
        </div>
      )}

      {data.picks.length === 0 && (
        <div className="border border-border rounded-xl p-8 text-center space-y-2">
          <p className="font-semibold">{t("emptyTitle")}</p>
          <p className="text-sm text-text-muted">{t("emptyBody")}</p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            {t("pendingHeader", { count: pending.length })}
          </h2>
          {pending.map((p, idx) => (
            <PickCard
              key={p.pick_number}
              pick={p}
              busy={busy === p.pick_number}
              tourTarget={idx === 0}
              onBuy={() => setBuySheet(p)}
              onSkip={() => decide(p, { status: "skipped" })}
              onRevert={() => revert(p)}
            />
          ))}
        </section>
      )}

      {decided.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            {t("decidedHeader")}
          </h2>
          {decided.map((p) => (
            <PickCard
              key={p.pick_number}
              pick={p}
              busy={busy === p.pick_number}
              onBuy={() => setBuySheet(p)}
              onSkip={() => decide(p, { status: "skipped" })}
              onRevert={() => revert(p)}
            />
          ))}
        </section>
      )}

      {buySheet && (
        <BuySheet
          pick={buySheet}
          defaultAmount={data.default_investment}
          busy={busy === buySheet.pick_number}
          onClose={() => setBuySheet(null)}
          onConfirm={(amount, saveDefault) =>
            decide(buySheet, {
              status: "bought",
              buy_price: buySheet.price_at_pick,
              amount_invested: amount,
              save_as_default: saveDefault,
            })
          }
        />
      )}
    </div>
  );
}

function PickCard({
  pick,
  busy,
  tourTarget,
  onBuy,
  onSkip,
  onRevert,
}: {
  pick: PickItem;
  busy: boolean;
  tourTarget?: boolean;
  onBuy: () => void;
  onSkip: () => void;
  onRevert: () => void;
}) {
  const t = useTranslations("PicksFeed");
  const positive = pick.return_pct >= 0;

  return (
    <div
      data-tour={tourTarget ? "pick-card" : undefined}
      className="border border-border rounded-xl p-4 sm:p-5 hover:bg-card-hover/50 transition-colors"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground">{pick.ticker}</span>
            <span className="text-sm text-text-muted truncate">{pick.name}</span>
            {pick.type === "rebuy" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                {t("rebuy")}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-text-faint font-mono">
            {t("pickNumber", { n: pick.pick_number })} · {pick.date} · ${pick.price_at_pick.toFixed(2)}
          </p>
          <p className={`mt-1 text-sm font-mono ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {positive ? "+" : ""}
            {pick.return_pct.toFixed(2)}% {t("sincePick")}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pick.status === "pending" && (
            <>
              <button
                data-tour={tourTarget ? "buy-button" : undefined}
                onClick={onBuy}
                disabled={busy}
                className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
              >
                {t("boughtCta")}
              </button>
              <button
                onClick={onSkip}
                disabled={busy}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:bg-card-hover transition-colors disabled:opacity-50"
              >
                {t("skipCta")}
              </button>
            </>
          )}
          {pick.status === "bought" && (
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                {t("boughtBadge", { amount: (pick.amount_invested ?? 0).toFixed(0) })}
              </span>
              <button onClick={onRevert} disabled={busy} className="block ml-auto mt-1 text-xs text-text-faint hover:text-text-muted underline disabled:opacity-50">
                {t("undo")}
              </button>
            </div>
          )}
          {pick.status === "skipped" && (
            <div className="text-right">
              <span className="text-sm text-text-faint">{t("skippedBadge")}</span>
              <button onClick={onRevert} disabled={busy} className="block ml-auto mt-1 text-xs text-text-faint hover:text-text-muted underline disabled:opacity-50">
                {t("undo")}
              </button>
            </div>
          )}
        </div>
      </div>

      <Link href={`/stocks/${pick.ticker}`} className="mt-3 inline-block text-sm text-brand hover:text-brand-hover transition-colors">
        {t("viewResearch")} {"→"}
      </Link>
    </div>
  );
}

function BuySheet({
  pick,
  defaultAmount,
  busy,
  onClose,
  onConfirm,
}: {
  pick: PickItem;
  defaultAmount: number | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (amount: number, saveDefault: boolean) => void;
}) {
  const t = useTranslations("PicksFeed");
  const [amount, setAmount] = useState<string>(defaultAmount ? String(defaultAmount) : "");
  const [saveDefault, setSaveDefault] = useState(defaultAmount == null);
  const parsed = parseFloat(amount);
  const valid = Number.isFinite(parsed) && parsed > 0;
  const shares = valid ? parsed / pick.price_at_pick : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-bold">{t("sheetTitle", { ticker: pick.ticker })}</h3>
          <p className="text-sm text-text-muted mt-1">
            {t("sheetSubtitle", { price: pick.price_at_pick.toFixed(2) })}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("sheetAmountLabel")}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50"
              autoFocus
              className="w-full rounded-lg border border-border bg-transparent pl-7 pr-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          {valid && (
            <p className="mt-1.5 text-xs text-text-faint font-mono">
              {"≈"} {shares.toFixed(4)} {t("sheetShares")}
            </p>
          )}
          <p className="mt-1.5 text-xs text-text-faint">{t("sheetAmountHint")}</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={saveDefault}
            onChange={(e) => setSaveDefault(e.target.checked)}
            className="rounded border-border"
          />
          {t("sheetSaveDefault")}
        </label>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted hover:bg-card-hover transition-colors"
          >
            {t("sheetCancel")}
          </button>
          <button
            onClick={() => valid && onConfirm(parsed, saveDefault)}
            disabled={!valid || busy}
            className="flex-1 rounded-lg bg-brand text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
          >
            {busy ? "…" : t("sheetConfirm")}
          </button>
        </div>

        <p className="text-xs text-text-faint">{t("sheetDisclaimer")}</p>
      </div>
    </div>
  );
}
