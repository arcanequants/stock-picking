"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";
import { splitLocale, switchLocaleHard, rememberLocale, LOCALE_COOKIE } from "@/lib/locale-url";

/**
 * First-visit language suggestion (the Airbnb/Booking pattern).
 *
 * SEO-safe by design — this is why it exists instead of an Accept-Language
 * redirect at the edge: Google explicitly recommends against automatic
 * locale redirects (crawlers get locked out of language versions), so the
 * server always serves the URL's language and the *client* politely offers
 * the visitor's browser language. Detection uses navigator.languages, the
 * choice persists in NEXT_LOCALE (read by the middleware to route "/" on
 * return visits), and dismissing pins the current language so it never
 * nags again. Bots run no JS state and carry no cookies: they see none of
 * this.
 */

const COPY: Record<Locale, { text: string; cta: string }> = {
  es: { text: "¿Prefieres leer en español?", cta: "Cambiar a español" },
  en: { text: "Read this site in English?", cta: "Switch to English" },
  pt: { text: "Prefere ler em português?", cta: "Mudar para português" },
  hi: { text: "यह साइट हिन्दी में पढ़ें?", cta: "हिन्दी में देखें" },
};

function hasLocaleCookie(): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith(`${LOCALE_COOKIE}=`));
}

function browserLocale(): Locale | null {
  for (const lang of navigator.languages ?? [navigator.language]) {
    const primary = lang?.split("-")[0]?.toLowerCase();
    if ((locales as readonly string[]).includes(primary)) return primary as Locale;
  }
  return null;
}

export default function LocaleSuggestBanner() {
  const pathname = usePathname();
  const [suggest, setSuggest] = useState<Locale | null>(null);

  useEffect(() => {
    if (hasLocaleCookie()) return;
    const detected = browserLocale();
    const current = splitLocale(window.location.pathname).locale;
    if (detected && detected !== current) setSuggest(detected);
    // Re-evaluate per page view, but a stored choice always wins.
  }, [pathname]);

  if (!suggest) return null;
  const copy = COPY[suggest];

  const dismiss = () => {
    // Pin the language they are already reading — ask once, remember forever.
    rememberLocale(splitLocale(window.location.pathname).locale);
    setSuggest(null);
  };

  return (
    <div
      role="region"
      aria-label={copy.text}
      style={{
        background: "#0B1026",
        color: "#E6ECF5",
        fontSize: 14,
        lineHeight: 1.4,
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        flexWrap: "wrap",
        borderBottom: "1px solid #28325A",
      }}
    >
      <span>{copy.text}</span>
      <button
        onClick={() => switchLocaleHard(suggest)}
        style={{
          background: "#18A8D8",
          color: "#0B1026",
          border: 0,
          borderRadius: 6,
          padding: "6px 14px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {copy.cta}
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          background: "transparent",
          color: "#8E9BB8",
          border: 0,
          fontSize: 18,
          lineHeight: 1,
          cursor: "pointer",
          padding: "4px 6px",
        }}
      >
        ×
      </button>
    </div>
  );
}
