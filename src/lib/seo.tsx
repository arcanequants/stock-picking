import type { Stock } from "@/lib/types";
import { getLocalizedField } from "@/data/stock-translations";
import { QUANT_LAB_ENABLED } from "@/lib/feature-flags";

const SITE_URL = "https://vectorialdata.com";

/* ── Plain-text helpers for meta/schema descriptions ──── */

/** Strip markdown syntax so descriptions read as plain text. */
export function stripMarkdown(md: string): string {
  return (md || "")
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`([^`]*)`/g, "$1") // inline code
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)([^*_]+)\1/g, "$2") // italic
    .replace(/^\s*>\s?/gm, "") // blockquotes
    .replace(/^\s*[-*+]\s+/gm, "") // list bullets
    .replace(/^---+$/gm, " ") // horizontal rules
    .replace(/\s+/g, " ")
    .trim();
}

/** Markdown-free description truncated at a word boundary (~155 chars). */
export function metaDescription(text: string, maxLength = 155): string {
  const plain = stripMarkdown(text);
  if (plain.length <= maxLength) return plain;
  const cut = plain.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const clipped = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(
    /[\s,;:.—–-]+$/,
    ""
  );
  return `${clipped}…`;
}

/* ── Stock meta: intent-query titles + descriptions ───── */

const META_LOCALE_TAGS: Record<string, string> = {
  es: "es-MX",
  en: "en-US",
  pt: "pt-BR",
  hi: "hi-IN",
};

/** ETFs are tagged via sector ("ETF" / "Broad Market ETF") in stocks.ts. */
export function isEtf(stock: Stock): boolean {
  return stock.sector.toLowerCase().includes("etf");
}

function formatMetaDate(iso: string, locale: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(
    META_LOCALE_TAGS[locale] ?? "es-MX",
    { day: "numeric", month: "short", year: "numeric" }
  );
}

/**
 * Title matches the questions people actually search ("¿comprar X?") instead
 * of the internal "TICKER — Name | Research" format. Three variants: ETF,
 * dividend pick (≥2.5% yield), plain company. Evergreen on purpose — no
 * prices or targets that go stale.
 */
export function getStockMetaTitle(stock: Stock, locale: string): string {
  const n = `${stock.name} (${stock.ticker})`;
  const etf = isEtf(stock);
  const div = !etf && (stock.dividend_yield ?? 0) >= 2.5;
  switch (locale) {
    case "en":
      if (etf) return `Is ${n} a Good Investment? ETF Analysis & Risks`;
      if (div) return `Should You Buy ${n}? Dividend, Analysis & Risks`;
      return `Should You Buy ${n}? Analysis, Price Target & Risks`;
    case "pt":
      if (etf) return `Vale a pena investir em ${n}? Análise do ETF e riscos`;
      if (div) return `Vale a pena comprar ${n}? Dividendos, análise e riscos`;
      return `Vale a pena comprar ${n}? Análise, preço-alvo e riscos`;
    case "hi":
      if (etf) return `क्या ${n} ETF में निवेश करें? विश्लेषण और जोखिम`;
      if (div) return `क्या ${n} शेयर खरीदें? डिविडेंड, विश्लेषण और जोखिम`;
      return `क्या ${n} शेयर खरीदें? विश्लेषण, टारगेट और जोखिम`;
    default:
      if (etf) return `¿Invertir en ${n}? Análisis del ETF y riesgos`;
      if (div) return `¿Comprar ${n}? Análisis, dividendo y riesgos`;
      return `¿Comprar ${n}? Análisis, precio objetivo y riesgos`;
  }
}

/** Localized summary prefixed with the last-updated date (freshness signal). */
export function getStockMetaDescription(stock: Stock, locale: string): string {
  const summary = getLocalizedField(stock, "summary_short", locale);
  const date = stock.last_updated_at
    ? formatMetaDate(stock.last_updated_at, locale)
    : null;
  const prefix = date
    ? {
        en: `Updated ${date}. `,
        pt: `Atualizado em ${date}. `,
        hi: `${date} को अपडेट किया गया। `,
        es: `Actualizado el ${date}. `,
      }[locale] ?? `Actualizado el ${date}. `
    : "";
  return metaDescription(`${prefix}${summary}`);
}

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
  const description = stripMarkdown(
    getLocalizedField(stock, "summary_short", locale)
  );
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

  const loc = ["en", "pt", "hi"].includes(locale) ? locale : "es";
  const name = stock.name;
  const ticker = stock.ticker;
  const etf = isEtf(stock);
  const yieldPct = stock.dividend_yield;

  // Questions in the page's language (they were hardcoded in English before,
  // which mismatched the visible es/pt/hi content). Answers beyond the three
  // summaries are derived strictly from stocks.ts fields — nothing invented.
  const q = {
    es: {
      what: `¿Qué hace ${name}?`,
      why: `¿Por qué Vectorial Data eligió ${ticker}?`,
      risk: `¿Cuáles son los riesgos de invertir en ${ticker}?`,
      dividend: `¿${ticker} paga dividendos?`,
      dividendA: `Sí. ${name} paga un dividendo de aproximadamente ${yieldPct}% anual.`,
      etf: `¿${ticker} es un ETF o una acción?`,
      etfA: `${name} es un ETF (fondo cotizado): una sola compra te da un pedacito de muchas empresas a la vez, en lugar de una empresa individual.`,
      how: `¿Cómo puedo comprar ${ticker} con poco dinero?`,
      howA: `Puedes comprar fracciones de ${ticker} desde unos pocos dólares con cualquier bróker que ofrezca fracciones de acciones. El método de Vectorial Data: invierte la misma cantidad en cada pick, siempre.`,
      updated: `¿Cuándo se actualizó este análisis de ${ticker}?`,
      updatedA: (d: string) => `El análisis de ${ticker} se actualizó por última vez el ${d}.`,
    },
    en: {
      what: `What does ${name} do?`,
      why: `Why did Vectorial Data pick ${ticker}?`,
      risk: `What are the risks of investing in ${ticker}?`,
      dividend: `Does ${ticker} pay dividends?`,
      dividendA: `Yes. ${name} pays a dividend of about ${yieldPct}% per year.`,
      etf: `Is ${ticker} an ETF or a stock?`,
      etfA: `${name} is an ETF (exchange-traded fund): one purchase gives you a small piece of many companies at once, instead of a single company.`,
      how: `How can I buy ${ticker} with little money?`,
      howA: `You can buy fractional shares of ${ticker} starting from a few dollars with any broker that offers fractional shares. The Vectorial Data method: invest the same amount in every pick, every time.`,
      updated: `When was this ${ticker} analysis last updated?`,
      updatedA: (d: string) => `The ${ticker} analysis was last updated on ${d}.`,
    },
    pt: {
      what: `O que a ${name} faz?`,
      why: `Por que a Vectorial Data escolheu ${ticker}?`,
      risk: `Quais são os riscos de investir em ${ticker}?`,
      dividend: `${ticker} paga dividendos?`,
      dividendA: `Sim. A ${name} paga um dividendo de cerca de ${yieldPct}% ao ano.`,
      etf: `${ticker} é um ETF ou uma ação?`,
      etfA: `${name} é um ETF (fundo negociado em bolsa): uma única compra te dá um pedacinho de muitas empresas de uma vez, em vez de uma empresa individual.`,
      how: `Como posso comprar ${ticker} com pouco dinheiro?`,
      howA: `Você pode comprar frações de ${ticker} a partir de poucos dólares com qualquer corretora que ofereça ações fracionadas. O método da Vectorial Data: invista o mesmo valor em cada pick, sempre.`,
      updated: `Quando esta análise de ${ticker} foi atualizada?`,
      updatedA: (d: string) => `A análise de ${ticker} foi atualizada pela última vez em ${d}.`,
    },
    hi: {
      what: `${name} क्या करती है?`,
      why: `Vectorial Data ने ${ticker} क्यों चुना?`,
      risk: `${ticker} में निवेश के जोखिम क्या हैं?`,
      dividend: `क्या ${ticker} डिविडेंड देती है?`,
      dividendA: `हाँ। ${name} लगभग ${yieldPct}% वार्षिक डिविडेंड देती है।`,
      etf: `${ticker} ETF है या शेयर?`,
      etfA: `${name} एक ETF (एक्सचेंज-ट्रेडेड फंड) है: एक ही खरीद से आपको एक कंपनी की जगह कई कंपनियों का छोटा हिस्सा मिलता है।`,
      how: `कम पैसों में ${ticker} कैसे खरीदें?`,
      howA: `फ्रैक्शनल शेयर देने वाले किसी भी ब्रोकर से आप कुछ ही डॉलर से ${ticker} के अंश खरीद सकते हैं। Vectorial Data का तरीका: हर pick में हमेशा एक जैसी राशि लगाएँ।`,
      updated: `${ticker} का यह विश्लेषण कब अपडेट हुआ?`,
      updatedA: (d: string) => `${ticker} का विश्लेषण आखिरी बार ${d} को अपडेट किया गया था।`,
    },
  }[loc]!;

  const questions: { q: string; a: string }[] = [];

  if (what) questions.push({ q: q.what, a: stripMarkdown(what) });
  if (why) questions.push({ q: q.why, a: stripMarkdown(why) });
  if (risk) questions.push({ q: q.risk, a: stripMarkdown(risk) });
  if (etf) questions.push({ q: q.etf, a: q.etfA });
  if (!etf && yieldPct && yieldPct > 0)
    questions.push({ q: q.dividend, a: q.dividendA });
  questions.push({ q: q.how, a: q.howA });
  if (stock.last_updated_at)
    questions.push({
      q: q.updated,
      a: q.updatedA(formatMetaDate(stock.last_updated_at, loc)),
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
