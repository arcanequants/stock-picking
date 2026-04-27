"use client";

import { useState } from "react";

const PRESETS = [100, 500, 1000, 5000];
const MIN = 100;
const MAX = 10000;
const STEP = 50;

export default function SimulatedCopierCard({
  roi,
}: {
  roi: number | null;
}) {
  const [amount, setAmount] = useState(100);
  if (roi == null) return null;

  const profitShare = 0.1;
  const grossDiff = amount * (roi / 100);
  // Profit share only applies when we made money.
  const lead = grossDiff > 0 ? grossDiff * profitShare : 0;
  const netDiff = grossDiff - lead;
  const wouldBe = amount + netDiff;
  const positive = netDiff >= 0;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  return (
    <div className="border border-border rounded-2xl p-5">
      <h2 className="font-semibold mb-1">Si hubieras copiado este bot</h2>
      <p className="text-xs text-text-muted mb-4">
        Mueve el monto. Calculamos sobre los últimos 30 días, descontando el
        10% de profit share. No incluye comisiones de Binance.
      </p>

      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <label
            htmlFor="copy-amount"
            className="text-xs text-text-muted uppercase tracking-wider"
          >
            Capital inicial
          </label>
          <span className="text-base font-semibold">${fmt(amount)}</span>
        </div>
        <input
          id="copy-amount"
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                amount === p
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              ${p.toLocaleString("en-US")}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border/60 pt-4">
        <p className="text-xs text-text-muted mb-1">Hoy tendrías</p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl font-semibold">${fmt(wouldBe)}</span>
          <span
            className={`text-sm font-medium ${
              positive ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {positive ? "+" : ""}${fmt(netDiff)} ({roi.toFixed(2)}%)
          </span>
        </div>
        {lead > 0 && (
          <p className="text-xs text-text-faint mt-2">
            Profit share al lead trader: -${fmt(lead)} ya descontado.
          </p>
        )}
      </div>
    </div>
  );
}
