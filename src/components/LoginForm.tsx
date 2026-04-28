"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function LoginForm({ next }: { next: string }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After the magic-link email is sent, listen for the auth-success broadcast
  // from /auth/synced (fired by the tab the email link opens). When it lands,
  // navigate THIS tab to `next` so the user keeps their original browsing
  // context — no more "logged in over there, logged out here" split.
  useEffect(() => {
    if (!sent || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("vd-auth");
    channel.onmessage = (ev) => {
      if (ev.data?.type === "vd-auth-success") {
        const target =
          typeof ev.data.next === "string" && ev.data.next.startsWith("/")
            ? ev.data.next
            : next;
        window.location.assign(target);
      }
    };
    return () => channel.close();
  }, [sent, next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale, next }),
    });
    if (res.ok) setSent(true);
    else setError(t("genericError"));
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center py-6">
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
        <p className="text-base text-foreground font-medium mb-1">
          {t("checkEmail")}
        </p>
        <p className="text-sm text-text-muted">{email}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("emailPlaceholder")}
        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground"
        required
        autoFocus
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? "..." : t("sendLink")}
      </button>
      {error && <p className="text-sm text-rose-500">{error}</p>}
    </form>
  );
}
