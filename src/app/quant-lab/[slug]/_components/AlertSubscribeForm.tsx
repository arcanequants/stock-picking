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
        body: JSON.stringify({ email, source: "bot-detail" }),
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
        Listo. Te avisamos cuando el bot tenga cambios importantes de
        performance o de estrategia.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-border rounded-2xl p-5"
    >
      <h2 className="font-semibold mb-1">Recibir alertas de performance</h2>
      <p className="text-xs text-text-muted mb-3">
        Te escribimos sólo cuando hay un cambio relevante (drawdown fuerte, cambio de estrategia, o pausa del bot). Cero spam.
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
          {status === "loading" ? "..." : "Suscribirme"}
        </button>
      </div>
      {err && <p className="text-xs text-red-500 mt-2">{err}</p>}
    </form>
  );
}
