"use client";

import { useTransition } from "react";
import { setSignalView } from "@/lib/signals-view";
import type { SignalView } from "@/lib/signals";

export function SignalViewToggle({
  view,
  returnPath,
}: {
  view: SignalView;
  returnPath: string;
}) {
  const [pending, startTransition] = useTransition();

  function flip(next: SignalView) {
    if (next === view || pending) return;
    startTransition(async () => {
      await setSignalView(next, returnPath);
    });
  }

  return (
    <div
      role="tablist"
      aria-label="Signal view"
      className="inline-flex items-center rounded-full border border-border bg-card p-0.5 text-xs"
    >
      <button
        type="button"
        role="tab"
        aria-selected={view === "casual"}
        onClick={() => flip("casual")}
        disabled={pending}
        className={`px-3 py-1 rounded-full transition-colors ${
          view === "casual"
            ? "bg-foreground text-background font-medium"
            : "text-text-muted hover:text-foreground"
        }`}
      >
        Casual
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "pro"}
        onClick={() => flip("pro")}
        disabled={pending}
        className={`px-3 py-1 rounded-full transition-colors ${
          view === "pro"
            ? "bg-foreground text-background font-medium"
            : "text-text-muted hover:text-foreground"
        }`}
      >
        Pro
      </button>
    </div>
  );
}
