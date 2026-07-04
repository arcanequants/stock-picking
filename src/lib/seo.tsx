import type { Stock } from "@/lib/types";
import { getLocalizedField } from "@/data/stock-translations";
import { QUANT_LAB_ENABLED } from "@/lib/feature-flags";

const SITE_URL = "https://vectorialdata.com";

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
    description: QUANT_LAB_ENABLED
      ? "Vectorial Data is a multi-product market intelligence company. Branded house architecture: Vectorial Stocks (daily picks, $1/mo), Vectorial Signals (alternative-data signals), Vectorial Terminal (prediction markets + perps aggregator), Vectorial Quant Lab (systematic trading bots), and Vectorial News (real-time market events)."
      : "Vectorial Data is a multi-product market intelligence company. Branded house architecture: Vectorial Stocks (daily picks, $1/mo), Vectorial Signals (alternative-data signals), Vectorial Terminal (prediction markets + perps aggregator), and Vectorial News (real-time market events).",
    foundingDate: "2026",
    areaServed: "Worldwide",
    knowsAbout: [
      "Stock Analysis",
      "Alternative Data",
      "Satellite Intelligence",
      "AIS / Maritime Intelligence",
      "Prediction Markets",
      "Perpetual Futures",
      "Systematic Trading",
      "Quantitative Research",
      "Global Equities",
    ],
    sameAs: ["https://github.com/arcanequants/stock-picking"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Vectorial Data services",
      itemListElement: [
        { "@type": "Offer", itemOffered: getServiceSchema("stocks") },
        { "@type": "Offer", itemOffered: getServiceSchema("signals") },
        { "@type": "Offer", itemOffered: getServiceSchema("terminal") },
        ...(QUANT_LAB_ENABLED
          ? [{ "@type": "Offer", itemOffered: getServiceSchema("quant-lab") }]
          : []),
        { "@type": "Offer", itemOffered: getServiceSchema("news") },
      ],
    },
  };
}

/* ── Service (per branded-house product) ──────────────── */

type ServiceId = "stocks" | "signals" | "terminal" | "quant-lab" | "news";

const SERVICES: Record<
  ServiceId,
  {
    name: string;
    url: string;
    serviceType: string;
    description: string;
    sameAs?: string[];
  }
> = {
  stocks: {
    name: "Vectorial Stocks",
    url: `${SITE_URL}/stocks`,
    serviceType: "Stock Research and Analysis",
    description:
      "Daily researched stock picks across global equities, delivered via email, web, and app. Every pick is cryptographically attested on Base (Ethereum L2) via SHA-256 hash chain. Subscription: $1/month.",
  },
  signals: {
    name: "Vectorial Signals",
    url: `${SITE_URL}/signals`,
    serviceType: "Alternative Data Signals",
    description:
      "Alternative-data signals from public satellites, AIS, EIA, USDA, and TROPOMI — cleaned, baselined, and translated to plain language. Descriptive market intelligence with publicly-published Information Coefficient per signal.",
  },
  terminal: {
    name: "Vectorial Terminal",
    url: "https://terminal.vectorialdata.com",
    serviceType: "Prediction Markets and Perpetual Futures Aggregator",
    description:
      "Trading terminal aggregating Hyperliquid (perps), Polymarket (prediction markets), and Azuro across one interface. Includes AI agents and Brier / calibration metrics.",
  },
  "quant-lab": {
    name: "Vectorial Quant Lab",
    url: `${SITE_URL}/quant-lab`,
    serviceType: "Systematic Trading Bots",
    description:
      "Laboratory of systematic trading bots with public real-time performance — Arcane Quant (Binance Futures Copy Trading) and beyond. No promises, just transparent equity curves.",
  },
  news: {
    name: "Vectorial News",
    url: `${SITE_URL}/notifications`,
    serviceType: "Financial News and Market Events",
    description:
      "Real-time market events relevant to Vectorial Data picks, with AI-generated explanations of why each event matters. Free preview; full explanations on Pro.",
  },
};

export function getServiceSchema(id: ServiceId) {
  const s = SERVICES[id];
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    url: s.url,
    serviceType: s.serviceType,
    description: s.description,
    areaServed: "Worldwide",
    provider: {
      "@type": "Organization",
      name: "Vectorial Data",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
    brand: { "@type": "Brand", name: s.name },
    isPartOf: {
      "@type": "Organization",
      name: "Vectorial Data",
      url: SITE_URL,
    },
  };
}

/* ── Article (stock research pages) ───────────────────── */

export function getArticleSchema(stock: Stock, locale: string) {
  const description = getLocalizedField(stock, "summary_short", locale);
  return {
    "@context": "https://schema.org",
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
    "@context": "https://schema.org",
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
      "Full access to daily stock picks, complete research reports, portfolio tracking, and historical data. Delivered via email, web, and app every day.",
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

/* ── Generic Article schema (non-stock pages) ─────────── */

export function getGenericArticleSchema(args: {
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: args.headline,
    description: args.description,
    datePublished: args.datePublished,
    dateModified: args.dateModified,
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
    mainEntityOfPage: args.url,
  };
}

/* ── Generic FAQPage (non-stock pages) ────────────────── */

export function getGenericFaqSchema(
  questions: { question: string; answer: string }[],
) {
  if (questions.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
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
