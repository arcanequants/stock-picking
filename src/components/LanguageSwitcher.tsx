"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

const LOCALES = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
  { code: "pt", label: "PT" },
  { code: "hi", label: "HI" },
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * Switching language is now a navigation, not a cookie flip and a refresh:
   * each language lives at its own URL, so the reader lands on the same page
   * in the new language and can share that link. `usePathname` here comes
   * from the i18n wrappers and returns the path without the locale prefix,
   * so dynamic routes (/stocks/[ticker]) survive the swap.
   */
  const switchLocale = (newLocale: string) => {
    setOpen(false);
    startTransition(() => {
      router.replace(
        // @ts-expect-error — params of the current dynamic route pass through
        { pathname, params },
        { locale: newLocale }
      );
    });
  };

  const current = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-text-muted hover:text-foreground hover:bg-card-hover transition-colors font-medium"
        aria-label={`${locale.toUpperCase()}`}
        disabled={isPending}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {current.label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 py-1 min-w-[80px]">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => switchLocale(l.code)}
                className={`block w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  l.code === locale
                    ? "text-brand-text font-semibold bg-brand-subtle"
                    : "text-text-muted hover:text-foreground hover:bg-card-hover"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
