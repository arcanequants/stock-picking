"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function LoginExpiredBanner({ isAuthed = false }: { isAuthed?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasExpiredParam = searchParams.get("login") === "expired";
  const t = useTranslations("Auth");
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [state, setState] = useState<"form" | "sending" | "sent">("form");
  const [dismissed, setDismissed] = useState(false);

  // If the user is already authed (session cookie set by another tab via the
  // magic link), strip the stale ?login=expired so the banner can't reappear
  // on refresh and so other consumers of the URL stay clean.
  useEffect(() => {
    if (isAuthed && hasExpiredParam) {
      router.replace(pathname);
    }
  }, [isAuthed, hasExpiredParam, pathname, router]);

  if (!hasExpiredParam || dismissed || isAuthed) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");

    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });

    if (res.ok) setState("sent");
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
