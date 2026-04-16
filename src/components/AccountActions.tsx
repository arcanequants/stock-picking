"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface AccountActionsProps {
  labels: {
    manage: string;
    logout: string;
  };
}

export default function AccountActions({ labels }: AccountActionsProps) {
  const [loadingManage, setLoadingManage] = useState(false);

  const handleManage = async () => {
    setLoadingManage(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoadingManage(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleManage}
        disabled={loadingManage}
        className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loadingManage ? "..." : labels.manage}
      </button>
      <button
        onClick={handleLogout}
        className="border border-border text-text-secondary px-4 py-2 rounded-lg text-sm font-medium hover:text-foreground transition-colors"
      >
        {labels.logout}
      </button>
    </div>
  );
}
