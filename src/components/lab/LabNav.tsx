"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { splitLocale, switchLocaleHard } from "@/lib/locale-url";

const LOCALES = ["es", "en", "pt", "hi"] as const;

/**
 * Lab nav with a mobile hamburger. Below 880px the section links leave the
 * bar (only logo + theme toggle + access button fit) and move into a
 * slide-down panel; the panel closes on tap so anchor scrolling feels native.
 * Language: the shared dropdown on desktop, an inline row in the panel on
 * mobile (a dropdown-in-menu is two taps and clips against the panel edge).
 */
type Account = { title: string; desc: string; meta: string; href?: string };

export default function LabNav({
  links,
  access,
  terminal,
  accounts,
}: {
  links: Array<{ href: string; label: string }>;
  access: string;
  terminal: string;
  accounts: { terminal: Account; stocks: Account };
}) {
  const [open, setOpen] = useState(false);
  const [accOpen, setAccOpen] = useState(false);
  // URL-derived locale — the intl context goes stale across client-side
  // locale switches (see locale-url.ts).
  const { locale } = splitLocale(usePathname() ?? "/");

  // Two products, two sessions: the Terminal (trading, Privy wallet) and
  // Vectorial Stocks (picks subscription, /portfolio). A single "Access"
  // destination sent Stocks subscribers to the wrong product, so the button
  // opens a chooser — founder decision 2026-08-19.
  const accountMenu = (
    <div className="vl-accmenu" onClick={() => setAccOpen(false)}>
      <a href={terminal} target="_blank" rel="noopener">
        <span className="t"><b>{accounts.terminal.title}</b><i>↗</i></span>
        <span className="d">{accounts.terminal.desc}</span>
        <span className="m">{accounts.terminal.meta}</span>
      </a>
      <a href={accounts.stocks.href ?? "/portfolio"}>
        <span className="t"><b>{accounts.stocks.title}</b><i>→</i></span>
        <span className="d">{accounts.stocks.desc}</span>
        <span className="m">{accounts.stocks.meta}</span>
      </a>
    </div>
  );

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
          <span className="vl-acc">
            <button type="button" className="vl-btn" aria-expanded={accOpen} onClick={() => setAccOpen((o) => !o)}>
              {access} <span aria-hidden="true">▾</span>
            </button>
            {accOpen && (
              <>
                <span className="vl-accveil" onClick={() => setAccOpen(false)} />
                {accountMenu}
              </>
            )}
          </span>
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
                onClick={() => switchLocaleHard(c)}
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
