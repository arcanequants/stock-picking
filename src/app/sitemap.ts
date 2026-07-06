import type { MetadataRoute } from "next";
import { stocks, transactions } from "@/data/stocks";
import { listLiveSignals } from "@/lib/signals";
import { listEvents } from "@/lib/economic-events";
import { QUANT_LAB_ENABLED } from "@/lib/feature-flags";

const BASE = "https://vectorialdata.com";

// NOTE: hreflang alternates are intentionally omitted — all locales serve the
// same URL today, and hreflang entries pointing at a single URL are
// spec-invalid. Reintroduce them only once real /[locale]/ URLs exist.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* ── Static pages (no lastmod — stamping build time is noise) ── */
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/portfolio`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/stocks`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/picks`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/lecciones`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/economia`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/signals`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/signals/methodology`, changeFrequency: "weekly", priority: 0.6 },
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
    { url: `${BASE}/metodologia`, lastModified: "2026-04-10", changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/disclosures`, lastModified: "2026-04-10", changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/risk-disclosure`, lastModified: "2026-04-10", changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/legal-status`, lastModified: "2026-04-10", changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/terms`, lastModified: "2026-03-04", changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: "2026-03-04", changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/disclaimer`, lastModified: "2026-03-04", changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/legal/signals-terms`, lastModified: "2026-05-17", changeFrequency: "monthly", priority: 0.4 },
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

  /* ── Per-signal pages (/signals/[id] + /signals/[id]/brief.md) ─── */
  let signalPages: MetadataRoute.Sitemap = [];
  try {
    const signals = await listLiveSignals();
    signalPages = signals.flatMap((s) => [
      {
        url: `${BASE}/signals/${s.id}`,
        ...(s.updated_at ? { lastModified: s.updated_at } : {}),
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
      {
        url: `${BASE}/signals/${s.id}/brief.md`,
        ...(s.updated_at ? { lastModified: s.updated_at } : {}),
        changeFrequency: "daily" as const,
        priority: 0.5,
      },
    ]);
  } catch {
    // signals table not yet provisioned in this env — skip
  }

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

  return [...staticPages, ...stockPages, ...verifyPages, ...signalPages, ...economiaPages];
}
