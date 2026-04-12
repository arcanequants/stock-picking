import type { MetadataRoute } from "next";
import { stocks, transactions } from "@/data/stocks";

const BASE = "https://www.vectorialdata.com";

/** hreflang alternates — all locales serve the same URL (no /es/ prefix) */
function langs(path: string) {
  const url = `${BASE}${path}`;
  return { es: url, en: url, pt: url, hi: url };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  /* ── Static pages ─────────────────────────────────── */
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0, alternates: { languages: langs("/") } },
    { url: `${BASE}/portfolio`, lastModified: now, changeFrequency: "daily", priority: 0.9, alternates: { languages: langs("/portfolio") } },
    { url: `${BASE}/stocks`, lastModified: now, changeFrequency: "daily", priority: 0.9, alternates: { languages: langs("/stocks") } },
    { url: `${BASE}/lecciones`, lastModified: now, changeFrequency: "daily", priority: 0.9, alternates: { languages: langs("/lecciones") } },
    { url: `${BASE}/verify`, lastModified: now, changeFrequency: "daily", priority: 0.8, alternates: { languages: langs("/verify") } },
    { url: `${BASE}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.8, alternates: { languages: langs("/join") } },
    { url: `${BASE}/developers`, lastModified: now, changeFrequency: "weekly", priority: 0.8, alternates: { languages: langs("/developers") } },
    { url: `${BASE}/share/portfolio`, lastModified: now, changeFrequency: "daily", priority: 0.6, alternates: { languages: langs("/share/portfolio") } },
    { url: `${BASE}/metodologia`, lastModified: "2026-04-10", changeFrequency: "monthly", priority: 0.5, alternates: { languages: langs("/metodologia") } },
    { url: `${BASE}/disclosures`, lastModified: "2026-04-10", changeFrequency: "monthly", priority: 0.4, alternates: { languages: langs("/disclosures") } },
    { url: `${BASE}/risk-disclosure`, lastModified: "2026-04-10", changeFrequency: "monthly", priority: 0.4, alternates: { languages: langs("/risk-disclosure") } },
    { url: `${BASE}/legal-status`, lastModified: "2026-04-10", changeFrequency: "monthly", priority: 0.4, alternates: { languages: langs("/legal-status") } },
    { url: `${BASE}/terms`, lastModified: "2026-03-04", changeFrequency: "monthly", priority: 0.3, alternates: { languages: langs("/terms") } },
    { url: `${BASE}/privacy`, lastModified: "2026-03-04", changeFrequency: "monthly", priority: 0.3, alternates: { languages: langs("/privacy") } },
    { url: `${BASE}/disclaimer`, lastModified: "2026-03-04", changeFrequency: "monthly", priority: 0.3, alternates: { languages: langs("/disclaimer") } },
  ];

  /* ── Per-stock pages (/stocks/[ticker]) ───────────── */
  const stockPages: MetadataRoute.Sitemap = stocks.map((s) => ({
    url: `${BASE}/stocks/${s.ticker}`,
    lastModified: s.last_updated_at || now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    alternates: { languages: langs(`/stocks/${s.ticker}`) },
  }));

  /* ── Per-ticker verify pages (/verify/[ticker]) ───── */
  const verifyTickers = new Set(transactions.map((tx) => tx.ticker));
  const verifyPages: MetadataRoute.Sitemap = Array.from(verifyTickers).map((ticker) => ({
    url: `${BASE}/verify/${ticker}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
    alternates: { languages: langs(`/verify/${ticker}`) },
  }));

  /* ── Per-ticker share pages (/share/[ticker]) ─────── */
  const sharePages: MetadataRoute.Sitemap = Array.from(verifyTickers).map((ticker) => ({
    url: `${BASE}/share/${ticker}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.4,
    alternates: { languages: langs(`/share/${ticker}`) },
  }));

  return [...staticPages, ...stockPages, ...verifyPages, ...sharePages];
}
