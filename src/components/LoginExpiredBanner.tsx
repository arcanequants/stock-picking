"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginExpiredBanner() {
  const searchParams = useSearchParams();
  const showBanner = searchParams.get("login") === "expired";
  const t = useTranslations("Auth");

  const [email, setEmail] = useState("");
  const [state, setState] = useState<"form" | "sending" | "sent">("form");
  const [dismissed, setDismissed] = useState(false);

  if (!showBanner || dismissed) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/portfolio`,
      },
    });

    if (!error) setState("sent");
    else setState("form");
  };

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-text-faint hover:text-foreground"
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {state === "sent" ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          {t("linkExpiredSent")}
        </p>
      ) : (
        <>
          <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm mb-1">
            {t("linkExpiredTitle")}
          </p>
          <p className="text-xs text-text-muted mb-3">
            {t("linkExpiredDesc")}
          </p>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground"
              required
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="bg-brand hover:bg-brand-hover text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {state === "sending" ? "..." : t("sendLink")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
