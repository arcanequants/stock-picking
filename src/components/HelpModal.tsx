"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

type Category = "billing" | "delivery" | "feature" | "other";

export default function HelpModal({ open, onClose }: HelpModalProps) {
  const t = useTranslations("Help");
  const locale = useLocale();
  const [category, setCategory] = useState<Category>("other");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCategory("other");
      setMessage("");
      setLoading(false);
      setSent(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (message.trim().length < 5) {
      setError(t("errorTooShort"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message, locale }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "rate_limited") setError(t("errorRateLimited"));
        else if (data.error === "unauthorized") setError(t("errorUnauthorized"));
        else setError(t("errorGeneric"));
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t("title")}</h2>
            <p className="text-xs text-text-muted mt-0.5">{t("subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="text-text-muted hover:text-foreground p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-600 dark:text-emerald-400" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm text-foreground font-medium mb-1">{t("successTitle")}</p>
            <p className="text-sm text-text-muted mb-5">{t("successBody")}</p>
            <button
              onClick={onClose}
              className="text-sm text-text-muted hover:text-foreground transition-colors"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">{t("categoryLabel")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
              >
                <option value="billing">{t("catBilling")}</option>
                <option value="delivery">{t("catDelivery")}</option>
                <option value="feature">{t("catFeature")}</option>
                <option value="other">{t("catOther")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1.5">{t("messageLabel")}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("messagePlaceholder")}
                rows={5}
                maxLength={4000}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-y min-h-[100px]"
                autoFocus
                required
              />
              <p className="text-[11px] text-text-faint mt-1">{message.length} / 4000</p>
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 rounded-lg border border-border text-sm text-text-secondary hover:text-foreground hover:bg-card-hover transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-brand hover:bg-brand-hover text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "..." : t("send")}
              </button>
            </div>

            <p className="text-[11px] text-text-faint pt-1">{t("sla")}</p>
          </form>
        )}
      </div>
    </div>
  );
}
