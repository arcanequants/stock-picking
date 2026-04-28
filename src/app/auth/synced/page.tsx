import type { Metadata } from "next";
import SyncedClient from "./SyncedClient";

export const metadata: Metadata = {
  title: "Sesión iniciada — Vectorial Data",
  robots: { index: false, follow: false },
};

const SAFE_NEXT_PREFIXES = ["/account", "/portfolio", "/metodo", "/welcome"];

function sanitizeNext(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith("/")) return "/portfolio";
  if (SAFE_NEXT_PREFIXES.some((p) => value === p || value.startsWith(p + "/"))) {
    return value;
  }
  return "/portfolio";
}

export default async function AuthSyncedPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = sanitizeNext(rawNext);
  return <SyncedClient next={next} />;
}
