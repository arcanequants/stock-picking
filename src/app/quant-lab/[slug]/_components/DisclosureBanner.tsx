"use client";

import { useState } from "react";

export default function DisclosureBanner() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-amber-500/20 bg-amber-500/[0.03] rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300/80">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
        aria-expanded={open}
      >
        <span aria-hidden>⚠</span>
        <span className="flex-1">
          Copy trading apalancado. Riesgo de pérdida total.
        </span>
        <span className="text-amber-700/60 dark:text-amber-300/50">
          {open ? "ocultar" : "ver detalles"}
        </span>
      </button>
      {open && (
        <p className="mt-2 leading-relaxed pl-6">
          Rendimiento pasado no garantiza resultados futuros. El copy trading de
          futuros con apalancamiento puede resultar en pérdida total del
          capital. Binance ejecuta y custodia todas las operaciones. Vectorial
          Data sólo muestra métricas públicas.
        </p>
      )}
    </div>
  );
}
