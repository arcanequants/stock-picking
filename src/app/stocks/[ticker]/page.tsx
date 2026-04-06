import { stocks, transactions } from "@/data/stocks";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import BlockchainBadge from "@/components/BlockchainBadge";
import { getLocalizedField } from "@/data/stock-translations";
import { JsonLd, getArticleSchema, getFaqSchema, getBreadcrumbSchema } from "@/lib/seo";

const localeMap: Record<string, string> = {
  es: "es-MX",
  en: "en-US",
  pt: "pt-BR",
  hi: "hi-IN",
};

export function generateStaticParams() {
  return stocks.map((stock) => ({ ticker: stock.ticker }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker } = await params;
  const stock = stocks.find(
    (s) => s.ticker.toLowerCase() === ticker.toLowerCase()
  );
  const t = await getTranslations("StockDetail");
  const locale = await getLocale();
  if (!stock) return { title: `${t("stockNotFound")} | Vectorial Data` };

  const localizedShort = getLocalizedField(stock, "summary_short", locale);
  return {
    title: `${stock.ticker} — ${stock.name} | Vectorial Data Research`,
    description: localizedShort,
    alternates: {
      canonical: `https://www.vectorialdata.com/stocks/${stock.ticker}`,
    },
    openGraph: {
      title: `${stock.ticker} — ${stock.name}`,
      description: localizedShort,
      images: [{ url: `/api/og/stock/${stock.ticker}`, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function StockResearchPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const stock = stocks.find(
    (s) => s.ticker.toLowerCase() === ticker.toLowerCase()
  );

  if (!stock) return notFound();

  const t = await getTranslations("StockDetail");
  const tLegal = await getTranslations("Legal");
  const locale = await getLocale();
  const dateLocale = localeMap[locale] || "es-MX";

  const renderMarkdown = (md: string) => {
    if (!md) return null;
    const lines = md.split("\n");
    const html: string[] = [];
    let inTable = false;
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.match(/^---+$/)) {
        if (inList) { html.push("</ul>"); inList = false; }
        if (inTable) { html.push("</tbody></table>"); inTable = false; }
        html.push("<hr />");
        continue;
      }
      if (line.includes("|") && line.trim().startsWith("|")) {
        if (inList) { html.push("</ul>"); inList = false; }
        const cells = line.split("|").filter((c) => c.trim()).map((c) => c.trim());
        if (cells.every((c) => c.match(/^[-:]+$/))) continue;
        if (!inTable) {
          html.push('<table><thead><tr>');
          cells.forEach((c) => (html[html.length - 1] += `<th>${applyInline(c)}</th>`));
          html[html.length - 1] += "</tr></thead><tbody>";
          inTable = true;
        } else {
          html.push("<tr>");
          cells.forEach((c) => (html[html.length - 1] += `<td>${applyInline(c)}</td>`));
          html[html.length - 1] += "</tr>";
        }
        continue;
      } else if (inTable) { html.push("</tbody></table>"); inTable = false; }
      if (line.startsWith("### ")) { if (inList) { html.push("</ul>"); inList = false; } html.push(`<h3>${applyInline(line.slice(4))}</h3>`); continue; }
      if (line.startsWith("## ")) { if (inList) { html.push("</ul>"); inList = false; } html.push(`<h2>${applyInline(line.slice(3))}</h2>`); continue; }
      if (line.startsWith("# ")) { if (inList) { html.push("</ul>"); inList = false; } html.push(`<h1>${applyInline(line.slice(2))}</h1>`); continue; }
      if (line.startsWith("> ")) { if (inList) { html.push("</ul>"); inList = false; } html.push(`<blockquote>${applyInline(line.slice(2))}</blockquote>`); continue; }
      if (line.match(/^[-*]\s/) || line.match(/^\d+\.\s/)) {
        if (!inList) { html.push("<ul>"); inList = true; }
        const content = line.replace(/^[-*]\s/, "").replace(/^\d+\.\s/, "");
        html.push(`<li>${applyInline(content)}</li>`);
        continue;
      } else if (inList && line.trim() === "") { html.push("</ul>"); inList = false; }
      if (line.trim()) html.push(`<p>${applyInline(line)}</p>`);
    }
    if (inList) html.push("</ul>");
    if (inTable) html.push("</tbody></table>");
    return html.join("\n");
  };

  const applyInline = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");
  };

  const researchHtml = renderMarkdown(stock.research_full);

  const faqSchema = getFaqSchema(stock, locale);
  const tx = transactions.find(t => t.ticker === stock.ticker);

  return (
    <>
    <JsonLd data={{
      "@context": "https://schema.org",
      "@graph": [
        getArticleSchema(stock, locale),
        ...(faqSchema ? [faqSchema] : []),
      ],
    }} />
    <JsonLd data={getBreadcrumbSchema([
      { name: "Home", url: "https://www.vectorialdata.com" },
      { name: "Stocks", url: "https://www.vectorialdata.com/stocks" },
      { name: stock.ticker, url: `https://www.vectorialdata.com/stocks/${stock.ticker}` },
    ])} />
    <div className="max-w-4xl mx-auto">
      <div className="text-sm text-text-faint mb-6">
        <Link href="/stocks" className="hover:text-text-secondary">{t("breadcrumb")}</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">{stock.ticker}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {stock.ticker} <span className="text-text-muted font-normal text-xl">— {stock.name}</span>
          </h1>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">{stock.sector}</span>
            <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">{stock.region}</span>
            <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">{stock.country}</span>
            <BlockchainBadge
              ticker={stock.ticker}
              attestationUid={transactions.find((t) => t.ticker === stock.ticker)?.attestation_uid}
            />
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="text-3xl font-mono font-bold">${stock.price?.toFixed(2)}</p>
          <p className="text-sm text-text-muted mt-1">
            {t("target")}: ${stock.analyst_target?.toFixed(2)} ({stock.analyst_upside && stock.analyst_upside > 0 ? "+" : ""}{stock.analyst_upside}%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <MetricBox label={t("peRatio")} value={stock.pe_ratio?.toFixed(1)} />
        <MetricBox label={t("peForward")} value={stock.pe_forward?.toFixed(1)} />
        <MetricBox label={t("dividend")} value={stock.dividend_yield ? `${stock.dividend_yield}%` : "—"} />
        <MetricBox label={t("marketCap")} value={stock.market_cap_b ? `$${stock.market_cap_b}B` : "—"} />
        <MetricBox label={t("eps")} value={stock.eps ? `$${stock.eps}` : "—"} />
        <MetricBox label={t("consensus")} value={stock.analyst_consensus} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded-xl p-4">
          <h3 className="text-xs text-text-faint uppercase tracking-wider mb-2">{t("whatTheyDo")}</h3>
          <p className="text-sm text-text-secondary">{getLocalizedField(stock, "summary_what", locale)}</p>
        </div>
        <div className="border border-emerald-500/20 rounded-xl p-4 bg-emerald-500/5">
          <h3 className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">{t("whyWeLikeIt")}</h3>
          <p className="text-sm text-text-secondary">{getLocalizedField(stock, "summary_why", locale)}</p>
        </div>
        <div className="border border-red-500/20 rounded-xl p-4 bg-red-500/5">
          <h3 className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">{t("keyRisk")}</h3>
          <p className="text-sm text-text-secondary">{getLocalizedField(stock, "summary_risk", locale)}</p>
        </div>
      </div>

      {/* Disclaimer above the fold */}
      <p className="text-xs text-text-faint italic border-t border-border pt-3 mb-8">
        {tLegal("notFinancialAdvice")} {tLegal("consultAdvisor")}
      </p>

      <p className="text-sm text-text-muted mb-6">
        {t("bluf", { ticker: stock.ticker, date: tx?.date ?? stock.first_researched_at, price: stock.price.toFixed(2) })}
      </p>

      <time dateTime={stock.last_updated_at} className="text-xs text-text-faint">
        {t("lastUpdated", { date: new Date(stock.last_updated_at + "T12:00:00").toLocaleDateString(localeMap[locale] ?? "es-MX", { day: "numeric", month: "short", year: "numeric" }) })}
      </time>

      {researchHtml && (
        <div className="border border-border rounded-xl p-6 md:p-8">
          <h2 className="text-xl font-bold mb-6">{t("fullResearch")}</h2>
          <div className="prose-research" dangerouslySetInnerHTML={{ __html: researchHtml }} />
        </div>
      )}

      <div className="mt-8 text-xs text-text-faint flex gap-4">
        <span>{t("researched")}: {new Date(stock.first_researched_at).toLocaleDateString(dateLocale)}</span>
        <span>{t("updated")}: {new Date(stock.last_updated_at).toLocaleDateString(dateLocale)}</span>
        {stock.next_review_at && (
          <span>{t("nextReview")}: {new Date(stock.next_review_at).toLocaleDateString(dateLocale)}</span>
        )}
      </div>

      <p className="mt-4 text-xs text-text-faint italic">{t("legalDisclaimer")}</p>
      <p className="mt-1 text-xs text-text-faint">{tLegal("holdPositions")}</p>
      <p className="mt-1 text-xs text-text-faint">{tLegal("pastPerformance")}</p>
      {locale === "hi" && (
        <p className="mt-2 text-xs text-text-faint border border-border rounded-lg p-3">
          {tLegal("sebiDisclaimer")}
        </p>
      )}
    </div>
    </>
  );
}

function MetricBox({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="border border-border rounded-lg p-3">
      <p className="text-xs text-text-faint">{label}</p>
      <p className="text-lg font-mono font-bold text-foreground mt-1">{value || "—"}</p>
    </div>
  );
}
