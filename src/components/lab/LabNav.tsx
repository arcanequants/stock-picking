"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const LOCALES = ["es", "en", "pt", "hi"] as const;

/**
 * Lab nav with a mobile hamburger. Below 880px the section links leave the
 * bar (only logo + theme toggle + access button fit) and move into a
 * slide-down panel; the panel closes on tap so anchor scrolling feels native.
 * Language: the shared dropdown on desktop, an inline row in the panel on
 * mobile (a dropdown-in-menu is two taps and clips against the panel edge).
 */
export default function LabNav({
  links,
  access,
  terminal,
}: {
  links: Array<{ href: string; label: string }>;
  access: string;
  terminal: string;
}) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (code: string) => {
    setOpen(false);
    router.replace(pathname, { locale: code });
  };

  return (
    <div className="vl-nav-wrap">
      <div className="vl-container vl-nav">
        <Image src="/logo.png" alt="Vectorial Data" width={42} height={42} />
        <span className="vl-name">Vectorial Data</span>
        <nav>
          {links.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
          <span className="vl-lang-dt"><LanguageSwitcher /></span>
          <ThemeToggle />
          <a className="vl-btn" href={terminal} target="_blank" rel="noopener">{access}</a>
          <button
            type="button"
            className="vl-burger"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? (
                <path d="M4.5 4.5 L15.5 15.5 M15.5 4.5 L4.5 15.5" />
              ) : (
                <path d="M3 5.5 H17 M3 10 H17 M3 14.5 H17" />
              )}
            </svg>
          </button>
        </nav>
      </div>
      {open && (
        <div className="vl-mmenu">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <div className="vl-mmenu-lang">
            {LOCALES.map((c) => (
              <button
                key={c}
                type="button"
                className={c === locale ? "on" : ""}
                onClick={() => switchLocale(c)}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
