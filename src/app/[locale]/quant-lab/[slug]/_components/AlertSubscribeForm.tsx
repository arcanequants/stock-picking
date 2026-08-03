"use client";

import { useState } from "react";

export default function AlertSubscribeForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErr(null);
    try {
      const res = await fetch(`/api/quant-lab/${slug}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "bot-detail-milestones" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErr((e as Error).message);
    }
  }

  if (status === "done") {
    return (
      <div className="border border-border rounded-2xl p-5 text-sm">
        <p className="font-medium mb-1">Listo, te avisamos.</p>
        <p className="text-text-muted text-xs leading-relaxed">
          Sin spam. Sólo cuando el bot llegue a un hito que importe — 6 meses
          de track record, 200 copiers, o un cambio de estrategia que debas
          conocer.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-border rounded-2xl p-5"
    >
      <h2 className="font-semibold mb-1">Avísame cuando madure</h2>
      <p className="text-xs text-text-muted mb-3 leading-relaxed">
        El bot lleva pocos meses en vivo. Si quieres esperar antes de copiar,
        déjanos tu email y te escribimos cuando cumpla 6 meses, llene los 200
        copiers, o cambie de estrategia. Sin newsletters, sin spam.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-transparent"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-foreground text-background px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Avísame"}
        </button>
      </div>
      {err && <p className="text-xs text-red-500 mt-2">{err}</p>}
    </form>
  );
}
