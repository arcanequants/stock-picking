import { stocks } from "@/data/stocks";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

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
  if (!stock) return { title: "Stock Not Found | Vectorial Data" };

  return {
    title: `${stock.ticker} — ${stock.name} | Vectorial Data Research`,
    description: stock.summary_short,
    openGraph: {
      title: `${stock.ticker} — ${stock.name}`,
      description: stock.summary_short,
      type: "article",
    },
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

  // Simple markdown-to-html (tables, bold, headers, lists, blockquotes, hr)
  const renderMarkdown = (md: string) => {
    if (!md) return null;

    const lines = md.split("\n");
    const html: string[] = [];
    let inTable = false;
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Horizontal rule
      if (line.match(/^---+$/)) {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        if (inTable) {
          html.push("</tbody></table>");
          inTable = false;
        }
        html.push("<hr />");
        continue;
      }

      // Table rows
      if (line.includes("|") && line.trim().startsWith("|")) {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        const cells = line
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim());
        // Skip separator rows
        if (cells.every((c) => c.match(/^[-:]+$/))) continue;

        if (!inTable) {
          html.push('<table><thead><tr>');
          cells.forEach(
            (c) =>
              (html[html.length - 1] += `<th>${applyInline(c)}</th>`)
          );
          html[html.length - 1] += "</tr></thead><tbody>";
          inTable = true;
        } else {
          html.push("<tr>");
          cells.forEach(
            (c) =>
              (html[html.length - 1] += `<td>${applyInline(c)}</td>`)
          );
          html[html.length - 1] += "</tr>";
        }
        continue;
      } else if (inTable) {
        html.push("</tbody></table>");
        inTable = false;
      }

      // Headers
      if (line.startsWith("### ")) {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        html.push(`<h3>${applyInline(line.slice(4))}</h3>`);
        continue;
      }
      if (line.startsWith("## ")) {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        html.push(`<h2>${applyInline(line.slice(3))}</h2>`);
        continue;
      }
      if (line.startsWith("# ")) {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        html.push(`<h1>${applyInline(line.slice(2))}</h1>`);
        continue;
      }

      // Blockquote
      if (line.startsWith("> ")) {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        html.push(`<blockquote>${applyInline(line.slice(2))}</blockquote>`);
        continue;
      }

      // List items
      if (line.match(/^[-*]\s/) || line.match(/^\d+\.\s/)) {
        if (!inList) {
          html.push("<ul>");
          inList = true;
        }
        const content = line.replace(/^[-*]\s/, "").replace(/^\d+\.\s/, "");
        html.push(`<li>${applyInline(content)}</li>`);
        continue;
      } else if (inList && line.trim() === "") {
        html.push("</ul>");
        inList = false;
      }

      // Paragraph
      if (line.trim()) {
        html.push(`<p>${applyInline(line)}</p>`);
      }
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-sm text-text-faint mb-6">
        <Link href="/stocks" className="hover:text-text-secondary">
          Stocks
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">{stock.ticker}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {stock.ticker}{" "}
            <span className="text-text-muted font-normal text-xl">
              — {stock.name}
            </span>
          </h1>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">
              {stock.sector}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">
              {stock.region}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">
              {stock.country}
            </span>
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="text-3xl font-mono font-bold">
            ${stock.price?.toFixed(2)}
          </p>
          <p className="text-sm text-text-muted mt-1">
            Target: ${stock.analyst_target?.toFixed(2)} (
            {stock.analyst_upside && stock.analyst_upside > 0 ? "+" : ""}
            {stock.analyst_upside}%)
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <MetricBox label="P/E Ratio" value={stock.pe_ratio?.toFixed(1)} />
        <MetricBox label="P/E Forward" value={stock.pe_forward?.toFixed(1)} />
        <MetricBox
          label="Div Yield"
          value={stock.dividend_yield ? `${stock.dividend_yield}%` : "—"}
        />
        <MetricBox
          label="Market Cap"
          value={stock.market_cap_b ? `$${stock.market_cap_b}B` : "—"}
        />
        <MetricBox label="EPS" value={stock.eps ? `$${stock.eps}` : "—"} />
        <MetricBox label="Consensus" value={stock.analyst_consensus} />
      </div>

      {/* Quick Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded-xl p-4">
          <h3 className="text-xs text-text-faint uppercase tracking-wider mb-2">
            What they do
          </h3>
          <p className="text-sm text-text-secondary">{stock.summary_what}</p>
        </div>
        <div className="border border-emerald-500/20 rounded-xl p-4 bg-emerald-500/5">
          <h3 className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
            Why we like it
          </h3>
          <p className="text-sm text-text-secondary">{stock.summary_why}</p>
        </div>
        <div className="border border-red-500/20 rounded-xl p-4 bg-red-500/5">
          <h3 className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
            Key Risk
          </h3>
          <p className="text-sm text-text-secondary">{stock.summary_risk}</p>
        </div>
      </div>

      {/* Full Research */}
      {researchHtml && (
        <div className="border border-border rounded-xl p-6 md:p-8">
          <h2 className="text-xl font-bold mb-6">Full Research</h2>
          <div
            className="prose-research"
            dangerouslySetInnerHTML={{ __html: researchHtml }}
          />
        </div>
      )}

      {/* Metadata */}
      <div className="mt-8 text-xs text-text-faint flex gap-4">
        <span>
          First researched:{" "}
          {new Date(stock.first_researched_at).toLocaleDateString()}
        </span>
        <span>
          Last updated:{" "}
          {new Date(stock.last_updated_at).toLocaleDateString()}
        </span>
        {stock.next_review_at && (
          <span>
            Next review:{" "}
            {new Date(stock.next_review_at).toLocaleDateString()}
          </span>
        )}
      </div>

      <p className="mt-4 text-xs text-text-faint italic">
        This is not financial advice. Consult a licensed financial advisor.
      </p>
    </div>
  );
}

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="border border-border rounded-lg p-3">
      <p className="text-xs text-text-faint">{label}</p>
      <p className="text-lg font-mono font-bold text-foreground mt-1">
        {value || "—"}
      </p>
    </div>
  );
}
