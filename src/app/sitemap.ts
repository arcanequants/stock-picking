import type { MetadataRoute } from "next";
import { stocks, transactions } from "@/data/stocks";

const BASE = "https://www.vectorialdata.com";
const LANGS = { es: `${BASE}`, en: `${BASE}`, pt: `${BASE}`, hi: `${BASE}` };

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  /* ── Static pages ─────────────────────────────────── */
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0, alternates: { languages: LANGS } },
    { url: `${BASE}/portfolio`, lastModified: now, changeFrequency: "daily", priority: 0.9, alternates: { languages: LANGS } },
    { url: `${BASE}/stocks`, lastModified: now, changeFrequency: "daily", priority: 0.9, alternates: { languages: LANGS } },
    { url: `${BASE}/verify`, lastModified: now, changeFrequency: "daily", priority: 0.8, alternates: { languages: LANGS } },
    { url: `${BASE}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.8, alternates: { languages: LANGS } },
    { url: `${BASE}/developers`, lastModified: now, changeFrequency: "weekly", priority: 0.8, alternates: { languages: LANGS } },
    { url: `${BASE}/share/portfolio`, lastModified: now, changeFrequency: "daily", priority: 0.6, alternates: { languages: LANGS } },
    { url: `${BASE}/terms`, lastModified: "2026-03-04", changeFrequency: "monthly", priority: 0.3, alternates: { languages: LANGS } },
    { url: `${BASE}/privacy`, lastModified: "2026-03-04", changeFrequency: "monthly", priority: 0.3, alternates: { languages: LANGS } },
    { url: `${BASE}/disclaimer`, lastModified: "2026-03-04", changeFrequency: "monthly", priority: 0.3, alternates: { languages: LANGS } },
  ];

  /* ── Per-stock pages (/stocks/[ticker]) ───────────── */
  const stockPages: MetadataRoute.Sitemap = stocks.map((s) => ({
    url: `${BASE}/stocks/${s.ticker}`,
    lastModified: s.last_updated_at || now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    alternates: { languages: LANGS },
  }));

  /* ── Per-ticker verify pages (/verify/[ticker]) ───── */
  const verifyTickers = new Set(transactions.map((tx) => tx.ticker));
  const verifyPages: MetadataRoute.Sitemap = Array.from(verifyTickers).map((ticker) => ({
    url: `${BASE}/verify/${ticker}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
    alternates: { languages: LANGS },
  }));

  /* ── Per-ticker share pages (/share/[ticker]) ─────── */
  const sharePages: MetadataRoute.Sitemap = Array.from(verifyTickers).map((ticker) => ({
    url: `${BASE}/share/${ticker}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.4,
    alternates: { languages: LANGS },
  }));

  return [...staticPages, ...stockPages, ...verifyPages, ...sharePages];
}
