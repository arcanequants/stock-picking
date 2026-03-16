"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="text-text-muted hover:text-foreground p-2"
        aria-label="Toggle menu"
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
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="block text-text-secondary hover:text-foreground py-2"
          >
            Home
          </Link>
          <Link
            href="/portfolio"
            onClick={() => setOpen(false)}
            className="block text-text-secondary hover:text-foreground py-2"
          >
            Portfolio
          </Link>
          <Link
            href="/stocks"
            onClick={() => setOpen(false)}
            className="block text-text-secondary hover:text-foreground py-2"
          >
            Stocks
          </Link>
          <Link
            href="/join"
            onClick={() => setOpen(false)}
            className="block bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-center font-medium"
          >
            Join $1.99/mo
          </Link>
        </div>
      )}
    </div>
  );
}
