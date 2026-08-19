import type { MetadataRoute } from "next";
import { stocks, transactions } from "@/data/stocks";
import { listEvents } from "@/lib/economic-events";
import {
  getSectorGroups,
  getCountryGroups,
  groupLastModified,
} from "@/lib/stock-lists";
import { QUANT_LAB_ENABLED } from "@/lib/feature-flags";
import { locales, defaultLocale } from "@/i18n/routing";
import { localeHref } from "@/lib/hreflang";

const BASE = "https://vectorialdata.com";

/**
 * Every entry below is written once, as the Spanish (unprefixed) URL, and
 * then expanded into one entry per language with hreflang annotations by
 * `withLocales()`. Writing the four variants by hand is how a sitemap drifts:
 * one forgotten locale and a whole language silently stops being submitted.
 *
 * hreflang is only valid now that each language has its own URL — before the
 * routing migration all four served the same path, which made the annotation
 * spec-invalid and it was deliberately left out.
 */
function withLocales(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return entries.flatMap((entry) => {
    const path = entry.url.startsWith(BASE)
      ? entry.url.slice(BASE.length)
      : entry.url;
    const languages: Record<string, string> = {};
    for (const l of locales) languages[l] = localeHref(l, path);
    languages["x-default"] = localeHref(defaultLocale, path);

    return locales.map((l) => ({
      ...entry,
      url: localeHref(l, path),
      alternates: { languages },
    }));
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* ── Static pages (no lastmod — stamping build time is noise) ── */
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/estrategias/stocks`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/copy-trading`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/outcomes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/portfolio`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/stocks`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/picks`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/lecciones`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/economia`, changeFrequency: "daily", priority: 0.8 },
    ...(QUANT_LAB_ENABLED
      ? ([
          { url: `${BASE}/quant-lab`, changeFrequency: "hourly", priority: 0.8 },
          { url: `${BASE}/quant-lab/arcane-quant`, changeFrequency: "hourly", priority: 0.8 },
          { url: `${BASE}/quant-lab/guia-copy-trading-binance`, changeFrequency: "monthly", priority: 0.5 },
          { url: `${BASE}/quant-lab/riesgos`, changeFrequency: "monthly", priority: 0.5 },
        ] as MetadataRoute.Sitemap)
      : []),
    { url: `${BASE}/verify`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/join`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/developers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/api-docs`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/metodo`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/metodologia`, lastModified: "2026-04-10", changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/disclosures`, lastModified: "2026-04-10", changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/risk-disclosure`, lastModified: "2026-04-10", changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/legal-status`, lastModified: "2026-04-10", changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/terms`, lastModified: "2026-03-04", changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: "2026-03-04", changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/disclaimer`, lastModified: "2026-03-04", changeFrequency: "monthly", priority: 0.3 },
  ];

  /* ── Per-stock pages (/stocks/[ticker]) — deduped ─────── */
  const seenStockUrls = new Set<string>();
  const stockPages: MetadataRoute.Sitemap = [];
  for (const s of stocks) {
    const url = `${BASE}/stocks/${s.ticker}`;
    if (seenStockUrls.has(url)) continue;
    seenStockUrls.add(url);
    stockPages.push({
      url,
      ...(s.last_updated_at ? { lastModified: s.last_updated_at } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    });
  }

  /* ── Category list pages (/acciones/*) ────────────── */
  const listPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/acciones`, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${BASE}/acciones/dividendos`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...getSectorGroups().map((g) => ({
      url: `${BASE}/acciones/sector/${g.slug}`,
      ...(groupLastModified(g.stocks)
        ? { lastModified: groupLastModified(g.stocks) }
        : {}),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...getCountryGroups().map((g) => ({
      url: `${BASE}/acciones/pais/${g.slug}`,
      ...(groupLastModified(g.stocks)
        ? { lastModified: groupLastModified(g.stocks) }
        : {}),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  /* ── Per-ticker verify pages (/verify/[ticker]) ───── */
  const latestTxDate = new Map<string, string>();
  for (const tx of transactions) {
    const prev = latestTxDate.get(tx.ticker);
    if (!prev || tx.date > prev) latestTxDate.set(tx.ticker, tx.date);
  }
  const verifyPages: MetadataRoute.Sitemap = Array.from(latestTxDate.entries()).map(
    ([ticker, date]) => ({
      url: `${BASE}/verify/${ticker}`,
      lastModified: date,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })
  );

  /* ── Per-event economia pages (/economia/[slug]) ──── */
  let economiaPages: MetadataRoute.Sitemap = [];
  try {
    const events = await listEvents(500);
    economiaPages = events.map((ev) => ({
      url: `${BASE}/economia/${ev.slug}`,
      ...(ev.event_date ? { lastModified: ev.event_date } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // economic_events table not yet provisioned in this env — skip
  }

  return withLocales([
    ...staticPages,
    ...listPages,
    ...stockPages,
    ...verifyPages,
    ...economiaPages,
  ]);
}
