"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";

export default function SetupForm() {
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const optionsRes = await fetch("/api/marketing/auth/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, setupSecret: secret }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.error || "Failed to get options");
      }

      const { options, adminId } = await optionsRes.json();

      const regResponse = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/marketing/auth/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, response: regResponse }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Registration failed");
      }

      setStatus("success");
      setTimeout(() => {
        router.push("/marketing");
        router.refresh();
      }, 1500);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Setup Passkey</h1>
          <p className="text-text-muted mt-2">
            One-time setup for dashboard access
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="alberto"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Setup Secret
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              placeholder="From .env.local"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {status === "loading"
              ? "Registering..."
              : status === "success"
                ? "Passkey registered!"
                : "Register Passkey"}
          </button>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {status === "success" && (
            <p className="text-green-500 text-sm text-center">
              Redirecting to dashboard...
            </p>
          )}
        </form>

        <p className="text-text-faint text-xs text-center">
          Already set up?{" "}
          <a href="/marketing/login" className="text-brand hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
