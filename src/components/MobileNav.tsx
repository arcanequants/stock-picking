"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface MobileNavProps {
  userEmail: string | null;
  isSubscribed: boolean;
}

export default function MobileNav({ userEmail, isSubscribed }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Nav");
  const tAuth = useTranslations("Auth");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/portfolio`,
      },
    });
    if (!error) setSent(true);
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

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="text-text-muted hover:text-foreground p-2"
        aria-label={t("openMenu")}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border py-4 px-4 space-y-3 z-50">
          <Link href="/" onClick={() => setOpen(false)} className="block text-text-secondary hover:text-foreground py-2">
            {t("home")}
          </Link>
          <Link href="/portfolio" onClick={() => setOpen(false)} className="block text-text-secondary hover:text-foreground py-2">
            {t("portfolio")}
          </Link>
          <Link href="/stocks" onClick={() => setOpen(false)} className="block text-text-secondary hover:text-foreground py-2">
            {t("stocks")}
          </Link>

          {/* Auth section */}
          {userEmail ? (
            <>
              <div className="border-t border-border pt-3 mt-3">
                <p className="text-xs text-text-faint truncate mb-2">{userEmail}</p>
                {isSubscribed && (
                  <button
                    onClick={handleManageSubscription}
                    className="block w-full text-left text-text-secondary hover:text-foreground py-2"
                  >
                    {tAuth("manageSubscription")}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-text-secondary hover:text-foreground py-2"
                >
                  {tAuth("logout")}
                </button>
              </div>
            </>
          ) : showLoginForm ? (
            <div className="border-t border-border pt-3 mt-3">
              {sent ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 py-2">
                  {tAuth("checkEmail")}
                </p>
              ) : (
                <form onSubmit={handleLogin} className="space-y-2">
                  <p className="text-sm text-text-muted">{tAuth("magicLinkPrompt")}</p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={tAuth("emailPlaceholder")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand hover:bg-brand-hover text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? "..." : tAuth("sendLink")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLoginForm(false)}
                    className="w-full text-sm text-text-muted py-1"
                  >
                    {tAuth("cancel")}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowLoginForm(true)}
                className="block w-full text-left text-text-secondary hover:text-foreground py-2 border-t border-border pt-3 mt-3"
              >
                {tAuth("login")}
              </button>
              {!isSubscribed && (
                <Link
                  href="/join"
                  onClick={() => setOpen(false)}
                  className="block bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-center font-medium"
                >
                  {t("join")}
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
