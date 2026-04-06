import type { Stock } from "@/lib/types";
import { getLocalizedField } from "@/data/stock-translations";

const SITE_URL = "https://www.vectorialdata.com";

/* ── JSON-LD renderer ─────────────────────────────────── */

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── Organization (site-wide) ─────────────────────────── */

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: "Vectorial Data",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Vectorial Data is a stock picking service that publishes daily researched stock picks across global equities. Every pick is cryptographically verified via SHA-256 hash chain on Base (Ethereum L2). Subscription costs $1/month with daily WhatsApp delivery.",
    foundingDate: "2026",
    areaServed: "Worldwide",
    serviceType: "Stock Research and Analysis",
    knowsAbout: [
      "Stock Analysis",
      "Fundamental Research",
      "Portfolio Management",
      "Global Equities",
      "Dividend Investing",
    ],
    sameAs: ["https://github.com/arcanequants/stock-picking"],
  };
}

/* ── Article (stock research pages) ───────────────────── */

export function getArticleSchema(stock: Stock, locale: string) {
  const description = getLocalizedField(stock, "summary_short", locale);
  return {
    "@type": "Article",
    headline: `${stock.ticker} — ${stock.name} | Stock Research`,
    description,
    datePublished: stock.first_researched_at,
    dateModified: stock.last_updated_at,
    author: {
      "@type": "Organization",
      name: "Vectorial Data",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Vectorial Data",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: `${SITE_URL}/stocks/${stock.ticker}`,
    about: {
      "@type": "Corporation",
      name: stock.name,
      tickerSymbol: stock.ticker,
    },
  };
}

/* ── FAQPage (stock research pages) ───────────────────── */

export function getFaqSchema(stock: Stock, locale: string) {
  const what = getLocalizedField(stock, "summary_what", locale);
  const why = getLocalizedField(stock, "summary_why", locale);
  const risk = getLocalizedField(stock, "summary_risk", locale);

  const questions: { q: string; a: string }[] = [];

  if (what) questions.push({ q: `What does ${stock.name} do?`, a: what });
  if (why)
    questions.push({
      q: `Why did Vectorial Data pick ${stock.ticker}?`,
      a: why,
    });
  if (risk)
    questions.push({
      q: `What are the risks of investing in ${stock.ticker}?`,
      a: risk,
    });

  if (questions.length === 0) return null;

  return {
    "@type": "FAQPage",
    mainEntity: questions.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/* ── Product + Offer (join page) ──────────────────────── */

export function getProductSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Vectorial Data Pro",
    description:
      "Full access to daily stock picks, complete research reports, portfolio tracking, and historical data. Delivered via WhatsApp every day.",
    brand: { "@type": "Organization", name: "Vectorial Data" },
    offers: {
      "@type": "Offer",
      price: "1.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/join`,
    },
  };
}

/* ── BreadcrumbList ───────────────────────────────────── */

export function getBreadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
