"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  ticketId: number;
}

export default function UserReplyForm({ ticketId }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (body.trim().length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "send_failed");
        setLoading(false);
        return;
      }
      setBody("");
      router.refresh();
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-xl p-4 bg-card">
      <label className="block text-xs text-text-muted mb-2">Tu respuesta</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        maxLength={10000}
        placeholder="Escribe tu respuesta…"
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-y min-h-[100px]"
        required
      />
      <p className="text-[11px] text-text-faint mt-1">{body.length} / 10000</p>

      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}

      <div className="flex justify-end mt-3">
        <button
          type="submit"
          disabled={loading || body.trim().length === 0}
          className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </form>
  );
}
