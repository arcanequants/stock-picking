"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface AuthButtonProps {
  userEmail: string | null;
  isSubscribed: boolean;
}

export default function AuthButton({
  userEmail,
  isSubscribed,
}: AuthButtonProps) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });

    if (res.ok) setSent(true);
    setLoading(false);
  };

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleManageSubscription = async () => {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  // Logged in
  if (userEmail) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-sm text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {userEmail.split("@")[0]}
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl p-3 shadow-xl min-w-[220px] z-50">
              <p className="text-xs text-text-faint mb-3 truncate px-1">
                {userEmail}
              </p>
              {isSubscribed && (
                <>
                  <Link
                    href="/account"
                    onClick={() => setShowMenu(false)}
                    className="block w-full text-left text-sm text-text-secondary hover:text-foreground hover:bg-card-hover px-2 py-1.5 rounded-lg transition-colors"
                  >
                    {t("account")}
                  </Link>
                  <button
                    onClick={handleManageSubscription}
                    className="block w-full text-left text-sm text-text-secondary hover:text-foreground hover:bg-card-hover px-2 py-1.5 rounded-lg transition-colors"
                  >
                    {t("manageSubscription")}
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="block w-full text-left text-sm text-text-secondary hover:text-foreground hover:bg-card-hover px-2 py-1.5 rounded-lg transition-colors"
              >
                {t("logout")}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Login form
  if (showLogin) {
    return (
      <div className="relative">
        <button
          onClick={() => {
            setShowLogin(false);
            setSent(false);
          }}
          className="text-sm text-text-muted hover:text-foreground transition-colors"
        >
          {t("cancel")}
        </button>

        <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl p-4 shadow-xl min-w-[280px] z-50">
          {sent ? (
            <div className="text-center py-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-emerald-600 dark:text-emerald-400"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm text-text-secondary">{t("checkEmail")}</p>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <p className="text-sm text-text-muted mb-3">
                {t("magicLinkPrompt")}
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm mb-2 text-foreground"
                required
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-hover text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "..." : t("sendLink")}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Default: login button
  return (
    <button
      onClick={() => setShowLogin(true)}
      className="text-sm text-text-muted hover:text-foreground transition-colors"
    >
      {t("login")}
    </button>
  );
}
