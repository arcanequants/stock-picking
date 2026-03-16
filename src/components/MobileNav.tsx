"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Nav");

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
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border py-4 px-4 space-y-3">
          <Link href="/" onClick={() => setOpen(false)} className="block text-text-secondary hover:text-foreground py-2">
            {t("home")}
          </Link>
          <Link href="/portfolio" onClick={() => setOpen(false)} className="block text-text-secondary hover:text-foreground py-2">
            {t("portfolio")}
          </Link>
          <Link href="/stocks" onClick={() => setOpen(false)} className="block text-text-secondary hover:text-foreground py-2">
            {t("stocks")}
          </Link>
          <Link href="/join" onClick={() => setOpen(false)} className="block bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-center font-medium">
            {t("join")}
          </Link>
        </div>
      )}
    </div>
  );
}
