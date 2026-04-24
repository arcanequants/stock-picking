"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface WelcomeFlowProps {
  children: React.ReactNode;
  locale: string;
}

export default function WelcomeFlow({ children, locale }: WelcomeFlowProps) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const t = useTranslations("Welcome");

  const [state, setState] = useState<
    "idle" | "loading" | "sent" | "resent" | "error"
  >(sessionId ? "loading" : "idle");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const sendLoginLink = useCallback(
    async (isResend = false) => {
      if (!sessionId) return;
      try {
        const res = await fetch("/api/auth/post-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            locale,
            resend: isResend,
          }),
        });
        const data = await res.json();
        if (res.ok && data.email_masked) {
          setMaskedEmail(data.email_masked);
          setState(isResend ? "resent" : "sent");
          if (isResend) setCooldown(60);
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      }
    },
    [sessionId, locale]
  );

  // Auto-send on mount if session_id present
  useEffect(() => {
    if (sessionId && state === "loading") {
      sendLoginLink(false);
    }
  }, [sessionId, state, sendLoginLink]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // No session_id — show normal welcome page
  if (!sessionId || state === "idle") {
    return <>{children}</>;
  }

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-8">
      {/* Success checkmark */}
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="text-emerald-600 dark:text-emerald-400"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold">{t("title")}</h1>

      {state === "loading" && (
        <div className="space-y-3">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-muted">{t("autoLoginTitle")}</p>
        </div>
      )}

      {(state === "sent" || state === "resent") && (
        <div className="space-y-4">
          <div className="border border-border rounded-xl p-5">
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-brand"
                strokeWidth="2"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-10 6L2 7" />
              </svg>
            </div>
            <p className="text-text-muted text-sm">
              {t("autoLoginDesc", { email: maskedEmail })}
            </p>
            {state === "resent" && (
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mt-2">
                {t("autoLoginResent")}
              </p>
            )}
          </div>

          <button
            onClick={() => sendLoginLink(true)}
            disabled={cooldown > 0}
            className="text-sm text-brand hover:text-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0
              ? t("autoLoginCooldown", { seconds: cooldown })
              : t("autoLoginResend")}
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">{t("autoLoginError")}</p>
          <button
            onClick={() => {
              setState("loading");
              sendLoginLink(false);
            }}
            className="text-sm text-brand hover:text-brand-hover transition-colors"
          >
            {t("autoLoginResend")}
          </button>
        </div>
      )}

      {/* Show delivery preferences below regardless */}
      {(state === "sent" || state === "resent") && children}
    </div>
  );
}
