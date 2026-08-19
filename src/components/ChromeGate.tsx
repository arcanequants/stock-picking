"use client";

import { usePathname } from "next/navigation";

/**
 * The Lab homepage ("/", "/en", "/pt", "/hi") ships its own nav/footer, so
 * the global product chrome must disappear there. This cannot be decided in
 * the server RootLayout: layouts persist across client-side navigations, so
 * arriving at the home from an inner page kept the global nav mounted and
 * showed two headers. usePathname is reactive to navigation (and correct on
 * SSR), so the chrome toggles on every route change.
 */
// Includes "es": the middleware rewrites "/" to "/es" internally, and
// usePathname sees the rewritten path during SSR.
const isLabPath = (p: string) => /^\/(?:(?:es|en|pt|hi)\/?)?$/.test(p);

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isLabPath(pathname)) return null;
  return <>{children}</>;
}

/** Inner pages get the boxed <main>; the Lab home renders full-bleed. */
export function MainGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isLabPath(pathname)) return <>{children}</>;
  return <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>;
}
