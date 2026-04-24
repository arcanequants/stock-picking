"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface DcaCalculatorProps {
  labels: {
    title: string;
    subtitle: string;
    budgetLabel: string;
    perPickLabel: string;
    perPickSuffix: string;
    saveButton: string;
    saving: string;
    saved: string;
    minHint: string;
  };
  // When true, component hits the API to persist. False = read-only demo
  // (useful on public /metodo page for visitors without a subscription).
  persist?: boolean;
}

const DEFAULT_BUDGET = 300;
const MIN_BUDGET = 30;
const PRESETS = [100, 300, 600, 1000];

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function DcaCalculator({
  labels,
  persist = false,
}: DcaCalculatorProps) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(!persist);

  useEffect(() => {
    if (!persist) return;
    let cancelled = false;
    (async () => {
      try {
        const url = sessionId
          ? `/api/subscriber/monthly-budget?session_id=${encodeURIComponent(sessionId)}`
          : "/api/subscriber/monthly-budget";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { monthlyBudget?: number | null };
        if (!cancelled && typeof json.monthlyBudget === "number") {
          setBudget(json.monthlyBudget);
        }
      } catch {
        // fall back to default
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [persist, sessionId]);

  async function handleSave() {
    if (!persist) return;
    setSaving(true);
    setSaved(false);
    try {
      const url = sessionId
        ? `/api/subscriber/monthly-budget?session_id=${encodeURIComponent(sessionId)}`
        : "/api/subscriber/monthly-budget";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudget: budget }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // silent fail; UI already shows value
    } finally {
      setSaving(false);
    }
  }

  const perPick = budget / 30;
  const belowMin = budget < MIN_BUDGET;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm">{labels.title}</h3>
        <p className="text-xs text-text-muted mt-1">{labels.subtitle}</p>
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setBudget(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              budget === p
                ? "border-brand bg-brand text-white"
                : "border-border text-text-muted hover:border-brand/50"
            }`}
          >
            {formatUsd(p)}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1.5">
          {labels.budgetLabel}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
            $
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_BUDGET}
            step={10}
            value={budget}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setBudget(n);
            }}
            className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-border bg-surface text-foreground text-lg font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        {belowMin && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
            {labels.minHint}
          </p>
        )}
      </div>

      {/* Divider arrow */}
      <div className="flex items-center justify-center text-text-faint">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </div>

      {/* Per-pick output */}
      <div className="rounded-xl border border-brand/30 bg-brand-subtle p-5 text-center">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {labels.perPickLabel}
        </p>
        <p className="text-4xl font-bold text-brand mt-1">
          {formatUsd(perPick)}
        </p>
        <p className="text-xs text-text-muted mt-1">{labels.perPickSuffix}</p>
      </div>

      {persist && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || belowMin || !hydrated}
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            {saving ? labels.saving : labels.saveButton}
          </button>
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              {labels.saved}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
