"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FreeSignupForm() {
  const t = useTranslations("FreeSignup");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!EMAIL_RE.test(email)) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/free-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus(data.already ? "already" : "success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success" || status === "already") {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3">
          <span className="text-emerald-600 dark:text-emerald-400 text-lg">&#10003;</span>
        </div>
        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
          {status === "already" ? t("alreadyRegistered") : t("success")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        placeholder={t("emailPlaceholder")}
        className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
        required
        disabled={status === "loading"}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-5 py-2.5 rounded-xl border border-brand text-brand font-medium text-sm hover:bg-brand hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {status === "loading" ? "..." : t("cta")}
      </button>
    </form>
  );
}
