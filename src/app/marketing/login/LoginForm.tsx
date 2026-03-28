"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    setStatus("loading");
    setError("");

    try {
      const optionsRes = await fetch("/api/marketing/auth/login-options", {
        method: "POST",
      });
      if (!optionsRes.ok) throw new Error("Failed to get options");
      const { options } = await optionsRes.json();

      const authResponse = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/marketing/auth/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: authResponse }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Authentication failed");
      }

      router.push("/marketing");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Authentication failed"
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Marketing Dashboard</h1>
          <p className="text-text-muted mt-2">Sign in with your passkey</p>
        </div>

        <button
          onClick={handleLogin}
          disabled={status === "loading"}
          className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {status === "loading" ? "Authenticating..." : "Sign in with Passkey"}
        </button>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <p className="text-text-faint text-xs">
          No passkey?{" "}
          <a href="/marketing/setup" className="text-brand hover:underline">
            Set up one
          </a>
        </p>
      </div>
    </div>
  );
}
