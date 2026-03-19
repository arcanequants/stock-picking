"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const t = useTranslations("Legal");

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setShow(true);
  }, []);

  const handleConsent = (value: "accepted" | "declined") => {
    localStorage.setItem("cookie-consent", value);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-text-muted">{t("cookieMessage")}</p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleConsent("declined")}
            className="px-4 py-1.5 text-sm border border-border rounded-lg text-text-muted hover:text-foreground transition-colors"
          >
            {t("cookieDecline")}
          </button>
          <button
            onClick={() => handleConsent("accepted")}
            className="px-4 py-1.5 text-sm bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          >
            {t("cookieAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}
