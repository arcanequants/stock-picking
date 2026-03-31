"use client";

import { useState } from "react";

interface TechnicalDetailsProps {
  label: string;
  children: React.ReactNode;
}

export default function TechnicalDetails({ label, children }: TechnicalDetailsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-foreground transition-colors"
      >
        <span
          className={`inline-block transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          &#9654;
        </span>
        {label}
      </button>
      {open && (
        <div className="mt-3 border border-border rounded-lg p-4 bg-card font-mono text-xs space-y-2 break-all">
          {children}
        </div>
      )}
    </div>
  );
}
