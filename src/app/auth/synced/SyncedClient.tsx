"use client";

import { useEffect, useState } from "react";

export default function SyncedClient({ next }: { next: string }) {
  const [canClose, setCanClose] = useState(true);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel("vd-auth");
        channel.postMessage({ type: "vd-auth-success", next });
      } catch {
        // BroadcastChannel can throw in some embedded contexts — best-effort.
      }
    }

    // window.close() only works for windows opened by JS. Email clients open a
    // brand-new tab, so this almost always silently fails — we detect that and
    // show a "puedes cerrar esta pestaña" message instead.
    const closeTimer = window.setTimeout(() => {
      try {
        window.close();
      } catch {
        // ignored
      }
      // If we're still here after a tick, the close was blocked.
      window.setTimeout(() => setCanClose(false), 50);
    }, 200);

    return () => {
      window.clearTimeout(closeTimer);
      channel?.close();
    };
  }, [next]);

  return (
    <div className="max-w-sm mx-auto py-12 px-4">
      <div className="border border-border rounded-2xl p-8 bg-surface text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-emerald-600 dark:text-emerald-400"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold mb-2">Sesión iniciada</h1>
        {canClose ? (
          <p className="text-sm text-text-muted">Cerrando esta pestaña…</p>
        ) : (
          <>
            <p className="text-sm text-text-muted mb-5">
              Regresa a la pestaña donde pediste el login, o continúa aquí.
            </p>
            <a
              href={next}
              className="inline-block bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
            >
              Continuar
            </a>
          </>
        )}
      </div>
    </div>
  );
}
