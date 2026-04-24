import { Resend } from "resend";
import type { PortfolioEvent, Stock, Transaction } from "@/lib/types";
import { stocks } from "@/data/stocks";

// Ticker → company name map (e.g., "ARM" → "Arm Holdings")
const NAMES: Record<string, string> = Object.fromEntries(
  stocks.map((s) => [s.ticker, s.name.replace(/ (PLC|Inc\.|Ltd\.|S\.A\.|AG|N\.V\.|Corporation|Company)\.?$/i, "")])
);

function companyName(ticker: string): string {
  return NAMES[ticker] ?? ticker;
}

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not configured");
    _resend = new Resend(key);
  }
  return _resend;
}

const SITE = "https://www.vectorialdata.com";
const FROM = "Vectorial Data <notifications@mail.vectorialdata.com>";

// Icons: keep for dividend, earnings, analyst, news — price moves use colored text instead
const EVENT_ICONS: Record<string, string> = {
  dividend: "💰",
  earnings: "📊",
  analyst: "⭐",
  news: "📰",
};

// --- i18n strings ---

const L: Record<string, Record<string, string>> = {
  es: {
    title: "Resumen Semanal",
    portfolioLabel: "Nuestro portafolio desde que empezamos",
    best: "Mejor",
    worst: "Peor",
    priceMoves: "Lo que se movió",
    dividends: "Dinero que llega",
    earnings: "La próxima semana",
    analysts: "Qué dicen los analistas",
    viewAll: "Ver qué significan estos movimientos",
    footer: "Esto no es consejo de inversión.",
    greeting: "Hola — así le fue a nuestro portafolio esta semana.",
    bottomLine: "En resumen",
    signoff: "— El equipo de Vectorial Data",
    freeTitle: "Qué pasó con nuestras acciones",
    freeCta: "Entiende TODO por $1/mes",
    freeMore: "eventos más esta semana",
    meaningLabel: "Qué significa",
    actionLabel: "Para nuestro portafolio",
    up: "subió",
    down: "bajó",
    exDiv: "te paga el",
    yield: "al año",
    reportsOn: "anuncia sus resultados financieros el",
    inDays: "en {days} días",
    analystUp: "recomiendan comprar",
    analystDown: "recomiendan comprar",
    near52High: "cerca de máximo 52 semanas",
    near52Low: "cerca de mínimo 52 semanas",
  },
  en: {
    title: "Weekly Summary",
    portfolioLabel: "Our portfolio since we started",
    best: "Best",
    worst: "Worst",
    priceMoves: "What moved",
    dividends: "Money coming in",
    earnings: "Next week",
    analysts: "What analysts say",
    viewAll: "See what these moves mean",
    footer: "This is not investment advice.",
    greeting: "Hi — here's how our portfolio did this week.",
    bottomLine: "Bottom line",
    signoff: "— The Vectorial Data team",
    freeTitle: "What happened with our stocks",
    freeCta: "Understand EVERYTHING for $1/mo",
    freeMore: "more events this week",
    meaningLabel: "What it means",
    actionLabel: "For our portfolio",
    up: "rose",
    down: "fell",
    exDiv: "pays you on",
    yield: "per year",
    reportsOn: "announces financial results on",
    inDays: "in {days} days",
    analystUp: "rate Buy",
    analystDown: "rate Buy",
    near52High: "near 52-week high",
    near52Low: "near 52-week low",
  },
  pt: {
    title: "Resumo Semanal",
    portfolioLabel: "Nosso portfólio desde o início",
    best: "Melhor",
    worst: "Pior",
    priceMoves: "O que se moveu",
    dividends: "Dinheiro chegando",
    earnings: "Próxima semana",
    analysts: "O que dizem os analistas",
    viewAll: "Veja o que esses movimentos significam",
    footer: "Isto não é conselho de investimento.",
    greeting: "Olá — veja como nosso portfólio foi esta semana.",
    bottomLine: "Resumindo",
    signoff: "— A equipe Vectorial Data",
    freeTitle: "O que aconteceu com nossas ações",
    freeCta: "Entenda TUDO por $1/mês",
    freeMore: "eventos a mais esta semana",
    meaningLabel: "O que significa",
    actionLabel: "Para nosso portfólio",
    up: "subiu",
    down: "caiu",
    exDiv: "te paga el",
    yield: "al año",
    reportsOn: "anuncia seus resultados financeiros em",
    inDays: "em {days} dias",
    analystUp: "recomendam compra",
    analystDown: "recomendam compra",
    near52High: "perto da máxima de 52 semanas",
    near52Low: "perto da mínima de 52 semanas",
  },
  hi: {
    title: "साप्ताहिक सारांश",
    portfolioLabel: "शुरू से हमारा पोर्टफोलियो",
    best: "सर्वश्रेष्ठ",
    worst: "सबसे खराब",
    priceMoves: "क्या हिला",
    dividends: "आने वाला पैसा",
    earnings: "अगला सप्ताह",
    analysts: "विश्लेषक क्या कहते हैं",
    viewAll: "इन बदलावों का मतलब देखें",
    footer: "यह निवेश सलाह नहीं है।",
    greeting: "नमस्ते — इस सप्ताह हमारे पोर्टफोलियो का हाल।",
    bottomLine: "सारांश",
    signoff: "— Vectorial Data टीम",
    freeTitle: "हमारे स्टॉक्स में क्या हुआ",
    freeCta: "$1/माह में सब समझें",
    freeMore: "और इवेंट इस सप्ताह",
    meaningLabel: "इसका मतलब",
    actionLabel: "हमारे पोर्टफोलियो के लिए",
    up: "बढ़ा",
    down: "गिरा",
    exDiv: "तुम्हें भुगतान करेगा",
    yield: "सालाना",
    reportsOn: "वित्तीय नतीजे घोषित करेगा",
    inDays: "{days} दिन में",
    analystUp: "खरीदने की सलाह",
    analystDown: "खरीदने की सलाह",
    near52High: "52-सप्ताह के उच्चतम के पास",
    near52Low: "52-सप्ताह के न्यूनतम के पास",
  },
};

function t(locale: string, key: string): string {
  return L[locale]?.[key] ?? L.en[key] ?? key;
}

// --- Data types ---

export interface DigestSummary {
  weeklyChangePct: number | null;
  totalReturnPct: number | null;
}

interface GroupedEvents {
  priceMoves: PortfolioEvent[];
  dividends: PortfolioEvent[];
  earnings: PortfolioEvent[];
  analysts: PortfolioEvent[];
  news: PortfolioEvent[];
}

// --- Helpers ---

// Translate stored English dates ("Apr 15") to locale ("15 de abr")
const MONTHS_ES: Record<string, string> = { Jan: "ene", Feb: "feb", Mar: "mar", Apr: "abr", May: "may", Jun: "jun", Jul: "jul", Aug: "ago", Sep: "sep", Oct: "oct", Nov: "nov", Dec: "dic" };
const MONTHS_PT: Record<string, string> = { Jan: "jan", Feb: "fev", Mar: "mar", Apr: "abr", May: "mai", Jun: "jun", Jul: "jul", Aug: "ago", Sep: "set", Oct: "out", Nov: "nov", Dec: "dez" };
const MONTHS_HI: Record<string, string> = { Jan: "जन", Feb: "फ़र", Mar: "मार्च", Apr: "अप्रैल", May: "मई", Jun: "जून", Jul: "जुल", Aug: "अग", Sep: "सित", Oct: "अक्ट", Nov: "नव", Dec: "दिस" };

function localizeDate(dateStr: string, locale: string): string {
  // Input: "Apr 15" → Output (es): "15 de abr"
  const match = dateStr.match(/^(\w+)\s+(\d+)$/);
  if (!match) return dateStr;
  const [, month, day] = match;
  if (locale === "es") return `${day} de ${MONTHS_ES[month] ?? month}`;
  if (locale === "pt") return `${day} de ${MONTHS_PT[month] ?? month}`;
  if (locale === "hi") return `${day} ${MONTHS_HI[month] ?? month}`;
  return dateStr; // English keeps "Apr 15"
}

function groupEvents(events: PortfolioEvent[]): GroupedEvents {
  return {
    priceMoves: events.filter((e) => e.event_type === "price_move"),
    dividends: events.filter((e) => e.event_type === "dividend"),
    earnings: events.filter((e) => e.event_type === "earnings"),
    analysts: events.filter((e) => e.event_type === "analyst"),
    news: events.filter((e) => e.event_type === "news"),
  };
}

function getSignedPct(e: PortfolioEvent): number {
  const pct = parseFloat(e.params.pct || "0");
  return e.title_key.includes("Down") || e.title_key.includes("down")
    ? -pct
    : pct;
}

function getBestWorst(priceMoves: PortfolioEvent[]): {
  best: PortfolioEvent | null;
  worst: PortfolioEvent | null;
} {
  if (priceMoves.length === 0) return { best: null, worst: null };
  // Deduplicate by ticker — keep the most extreme move per ticker
  const byTicker = new Map<string, PortfolioEvent>();
  for (const e of priceMoves) {
    const ticker = e.params.ticker;
    const existing = byTicker.get(ticker);
    if (!existing || Math.abs(getSignedPct(e)) > Math.abs(getSignedPct(existing))) {
      byTicker.set(ticker, e);
    }
  }
  const unique = [...byTicker.values()].sort(
    (a, b) => getSignedPct(b) - getSignedPct(a)
  );
  const best = unique[0];
  // Worst must be a DIFFERENT ticker than best
  const worst = unique.length > 1 ? unique[unique.length - 1] : null;
  return { best, worst };
}

// Price moves use colored arrows instead of emoji
function renderPriceMoveLine(e: PortfolioEvent, locale: string): string {
  const lang = L[locale] ? locale : "en";
  const p = e.params;
  const isUp = e.title_key.includes("Up");
  const color = isUp ? "#16a34a" : "#dc2626";
  const arrow = isUp ? "&#9650;" : "&#9660;";
  const verb = isUp ? t(lang, "up") : t(lang, "down");

  const name = companyName(p.ticker);

  if (e.title_key.includes("near52High") || e.title_key.includes("near52Low")) {
    const label = e.title_key.includes("High")
      ? t(lang, "near52High")
      : t(lang, "near52Low");
    return `<span style="color:${color};font-weight:700;">${arrow}</span> <a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${name}</strong></a> — ${label} (${p.pct}%)`;
  }

  return `<span style="color:${color};font-weight:700;">${arrow}</span> <a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${name}</strong></a> ${verb} <span style="color:${color};font-weight:600;">${p.pct}%</span>`;
}

function renderDigestLine(e: PortfolioEvent, locale: string): string {
  const lang = L[locale] ? locale : "en";
  const p = e.params;

  // Price moves handled separately with colors
  if (e.event_type === "price_move") return renderPriceMoveLine(e, locale);

  const name = companyName(p.ticker);
  const tickerLink = `<a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${name}</strong></a>`;

  if (e.title_key.includes("dividendExDate"))
    return `${tickerLink} — ${t(lang, "exDiv")} ${localizeDate(p.date, lang)} (${p.yield}% ${t(lang, "yield")})`;
  if (e.title_key.includes("dividendPaid"))
    return `${tickerLink} — ${p.amount}`;
  if (e.title_key.includes("earningsUpcoming"))
    return `${tickerLink} — ${t(lang, "reportsOn")} ${localizeDate(p.date, lang)}`;
  if (e.title_key.includes("ConsensusUp") || e.title_key.includes("ConsensusDown"))
    return `${tickerLink} — ${p.buyPct}% ${t(lang, "analystUp")} (${parseInt(p.analysts) === 1 ? "1 analista" : `${p.analysts} analistas`})`;
  if (e.title_key.includes("newsAlert"))
    return `${tickerLink} — ${p.headline}`;

  return `<strong>${name || p.ticker || ""}</strong>`;
}

function buildSectionHtml(
  title: string,
  events: PortfolioEvent[],
  locale: string,
  limit = 5
): string {
  if (events.length === 0) return "";
  const shown = events.slice(0, limit);
  const rows = shown
    .map((e) => {
      const icon =
        e.event_type === "price_move"
          ? ""
          : (EVENT_ICONS[e.event_type] ?? "📌") + " ";
      const line = renderDigestLine(e, locale);
      return `<tr><td style="padding:6px 0;font-size:14px;line-height:1.5;">${icon}${line}</td></tr>`;
    })
    .join("");

  const moreText =
    events.length > limit
      ? `<tr><td style="padding:4px 0;font-size:12px;color:#9ca3af;">+${events.length - limit} más</td></tr>`
      : "";

  return `
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #f4f4f5;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">${title}</p>
      <table style="width:100%;border-collapse:collapse;">${rows}${moreText}</table>
    </div>`;
}

function buildSummaryHtml(
  locale: string,
  summary: DigestSummary | null,
  best: PortfolioEvent | null,
  worst: PortfolioEvent | null
): string {
  const lang = L[locale] ? locale : "en";

  if (summary?.totalReturnPct == null) return "";

  const pct = summary.totalReturnPct;
  const sign = pct >= 0 ? "+" : "";
  const color = pct >= 0 ? "#16a34a" : "#dc2626";
  const bgColor = pct >= 0 ? "#f0fdf4" : "#fef2f2";
  const borderColor = pct >= 0 ? "#bbf7d0" : "#fecaca";

  let details = "";
  if (best) {
    const bestPct = best.params.pct;
    const bestDir = best.title_key.includes("Up") ? "+" : "-";
    let detailParts = `${t(lang, "best")}: <strong>${companyName(best.params.ticker)}</strong> ${bestDir}${bestPct}%`;
    if (worst) {
      const worstPct = worst.params.pct;
      const worstDir = worst.title_key.includes("Up") ? "+" : "-";
      detailParts += ` · ${t(lang, "worst")}: <strong>${companyName(worst.params.ticker)}</strong> ${worstDir}${worstPct}%`;
    }
    details = `<p style="margin:6px 0 0;font-size:13px;color:#6b7280;">${detailParts}</p>`;
  }

  return `
    <div style="background-color:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:14px 16px;margin-bottom:8px;">
      <p style="margin:0;font-size:13px;color:#374151;font-weight:500;">${t(lang, "portfolioLabel")}</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:${color};letter-spacing:-0.5px;">${sign}${pct.toFixed(2)}%</p>
      ${details}
    </div>`;
}

function buildBottomLine(
  events: PortfolioEvent[],
  summary: DigestSummary | null,
  locale: string
): string {
  const lang = L[locale] ? locale : "en";
  const grouped = groupEvents(events);
  const { best, worst } = getBestWorst(grouped.priceMoves);

  // Build a compelling narrative sentence
  const lines: string[] = [];

  // Lead with strongest move
  if (best) {
    const bestName = companyName(best.params.ticker);
    const bestPct = best.params.pct;
    const bestUp = best.title_key.includes("Up");
    if (bestUp) {
      lines.push(
        lang === "es" ? `${bestName} fue la estrella de la semana con +${bestPct}%`
          : lang === "pt" ? `${bestName} foi a estrela da semana com +${bestPct}%`
          : lang === "hi" ? `${bestName} इस सप्ताह +${bestPct}% के साथ स्टार रहा`
          : `${bestName} was the star this week at +${bestPct}%`
      );
    }
  }

  // Contrast with worst
  if (worst) {
    const worstName = companyName(worst.params.ticker);
    const worstPct = worst.params.pct;
    lines.push(
      lang === "es" ? `mientras ${worstName} bajó ${worstPct}%`
        : lang === "pt" ? `enquanto ${worstName} caiu ${worstPct}%`
        : lang === "hi" ? `जबकि ${worstName} ${worstPct}% गिरा`
        : `while ${worstName} dropped ${worstPct}%`
    );
  }

  // Dividends as a hook
  if (grouped.dividends.length > 0) {
    const divTickers = [...new Set(grouped.dividends.map((e) => companyName(e.params.ticker)))];
    const divNames = divTickers.slice(0, 2).join(lang === "es" ? " y " : lang === "pt" ? " e " : " and ");
    lines.push(
      lang === "es" ? `y ${divNames} ${divTickers.length > 1 ? "traen" : "trae"} dividendos pronto`
        : lang === "pt" ? `e ${divNames} ${divTickers.length > 1 ? "trazem" : "traz"} dividendos em breve`
        : lang === "hi" ? `और ${divNames} जल्द लाभांश ला रहा है`
        : `and ${divNames} ${divTickers.length > 1 ? "bring" : "brings"} dividends soon`
    );
  }

  // Earnings tease
  if (grouped.earnings.length > 0) {
    const earningNames = [...new Set(grouped.earnings.map((e) => companyName(e.params.ticker)))].slice(0, 2);
    lines.push(
      lang === "es" ? `${earningNames.join(" y ")} reporta${earningNames.length > 1 ? "n" : ""} resultados la próxima semana`
        : lang === "pt" ? `${earningNames.join(" e ")} reporta${earningNames.length > 1 ? "m" : ""} resultados na próxima semana`
        : lang === "hi" ? `${earningNames.join(" और ")} अगले सप्ताह रिपोर्ट करेगा`
        : `${earningNames.join(" and ")} report${earningNames.length > 1 ? "" : "s"} earnings next week`
    );
  }

  if (lines.length === 0) return "";

  // Join lines into a flowing sentence
  const sentence = lines[0].charAt(0).toUpperCase() + lines[0].slice(1) +
    (lines.length > 1 ? ", " + lines.slice(1).join(". ") : "") + ".";

  return `
    <div style="margin-top:24px;padding:12px 16px;background-color:#fafafa;border-radius:8px;">
      <p style="margin:0;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${t(lang, "bottomLine")}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#374151;line-height:1.5;">${sentence}</p>
    </div>`;
}

// Hidden preview text for email clients (shows after subject line)
function previewText(text: string): string {
  // Hidden text + whitespace padding to push default preview text away
  return `<div style="display:none;font-size:1px;color:#f9fafb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${text}${"&nbsp;".repeat(80)}</div>`;
}

function generateDynamicSubject(
  events: PortfolioEvent[],
  summary: DigestSummary | null,
  locale: string
): string {
  const priceMoves = events.filter((e) => e.event_type === "price_move");
  if (priceMoves.length > 0) {
    const sorted = [...priceMoves].sort(
      (a, b) => parseFloat(b.params.pct) - parseFloat(a.params.pct)
    );
    const top = sorted[0];
    const name = companyName(top.params.ticker);
    const isUp = top.title_key.includes("Up");
    const arrow = isUp ? "+" : "-";
    const rest = events.length - 1;
    const moreText: Record<string, string> = {
      es: `y ${rest} noticias más`,
      en: `and ${rest} more updates`,
      pt: `e ${rest} notícias mais`,
      hi: `और ${rest} अपडेट`,
    };
    const lang = moreText[locale] ? locale : "en";
    return `${name} ${arrow}${top.params.pct}% ${moreText[lang]} — Vectorial Data`;
  }
  const fallback: Record<string, string> = {
    es: `${events.length} noticias de nuestro portafolio — Vectorial Data`,
    en: `${events.length} updates from our portfolio — Vectorial Data`,
    pt: `${events.length} notícias do nosso portfólio — Vectorial Data`,
    hi: `${events.length} पोर्टफोलियो अपडेट — Vectorial Data`,
  };
  const lang = fallback[locale] ? locale : "en";
  return fallback[lang];
}

// --- Premium digest ---

function buildDigestHtml(
  events: PortfolioEvent[],
  locale: string,
  summary: DigestSummary | null
): string {
  const lang = L[locale] ? locale : "en";
  const grouped = groupEvents(events);
  const { best, worst } = getBestWorst(grouped.priceMoves);

  const preview = summary?.totalReturnPct != null
    ? `Portafolio ${summary.totalReturnPct >= 0 ? "+" : ""}${summary.totalReturnPct.toFixed(2)}%. ${grouped.priceMoves.length} movimientos, ${grouped.dividends.length} dividendos, ${grouped.earnings.length} earnings.`
    : `${events.length} eventos esta semana en nuestro portafolio.`;

  const summaryHtml = buildSummaryHtml(locale, summary, best, worst);
  const priceSection = buildSectionHtml(
    t(lang, "priceMoves"),
    grouped.priceMoves,
    locale,
    5
  );
  const divSection = buildSectionHtml(
    t(lang, "dividends"),
    grouped.dividends,
    locale,
    5
  );
  const earnSection = buildSectionHtml(
    t(lang, "earnings"),
    grouped.earnings,
    locale,
    6
  );

  // Analysts: show top 3 most extreme
  const notableAnalysts = [...grouped.analysts]
    .sort((a, b) => {
      const aExtr = Math.abs(parseFloat(a.params.buyPct || "50") - 50);
      const bExtr = Math.abs(parseFloat(b.params.buyPct || "50") - 50);
      return bExtr - aExtr;
    })
    .slice(0, 3);
  const analystSection = buildSectionHtml(
    t(lang, "analysts"),
    notableAnalysts,
    locale,
    3
  );

  const newsSection = buildSectionHtml("News", grouped.news, locale, 3);
  const bottomLine = buildBottomLine(events, summary, locale);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  ${previewText(preview)}
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
    <div style="background:#4f46e5;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">${t(lang, "title")}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Vectorial Data</p>
    </div>
    <div style="padding:20px 24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.5;">${t(lang, "greeting")}</p>
      ${summaryHtml}
      ${priceSection}
      ${divSection}
      ${earnSection}
      ${analystSection}
      ${newsSection}
      ${bottomLine}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e4e4e7;text-align:center;">
      <a href="${SITE}/notifications" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">${t(lang, "viewAll")}</a>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #f4f4f5;">
      <p style="margin:0;font-size:13px;color:#6b7280;">${t(lang, "signoff")}</p>
    </div>
    <div style="padding:12px 24px;text-align:center;font-size:11px;color:#a1a1aa;">
      <p style="margin:0;">Vectorial Data — <a href="${SITE}" style="color:#a1a1aa;">vectorialdata.com</a></p>
      <p style="margin:4px 0 0;">${t(lang, "footer")}</p>
    </div>
  </div>
</body>
</html>`;
}

// --- Free digest ---

function buildFreeDigestHtml(
  events: PortfolioEvent[],
  locale: string,
  summary: DigestSummary | null
): string {
  const lang = L[locale] ? locale : "en";
  const grouped = groupEvents(events);
  const { best, worst } = getBestWorst(grouped.priceMoves);

  const preview = summary?.totalReturnPct != null
    ? `Portafolio ${summary.totalReturnPct >= 0 ? "+" : ""}${summary.totalReturnPct.toFixed(2)}%. Abre para ver qué pasó.`
    : `${events.length} eventos esta semana. Abre para ver qué pasó.`;

  const summaryHtml = buildSummaryHtml(locale, summary, best, worst);

  // Show 1 featured event with AI explanation
  const featured = events[0];
  const featLine = renderDigestLine(featured, locale);
  const featIcon =
    featured.event_type === "price_move"
      ? ""
      : (EVENT_ICONS[featured.event_type] ?? "📌") + " ";
  const explanation =
    featured.explanations?.[locale as "en" | "es" | "pt" | "hi"] ??
    featured.explanations?.["en"];

  let explanationHtml = "";
  if (explanation) {
    explanationHtml = `
      <div style="background-color:#f0f0ff;border-radius:8px;padding:12px 16px;margin-top:10px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#4f46e5;text-transform:uppercase;">${t(lang, "meaningLabel")}</p>
        <p style="margin:0 0 10px;font-size:13px;color:#374151;line-height:1.5;">${explanation.meaning}</p>
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#4f46e5;text-transform:uppercase;">${t(lang, "actionLabel")}</p>
        <p style="margin:0;font-size:13px;color:#374151;line-height:1.5;">${explanation.action}</p>
      </div>`;
  }

  // Muted preview of 4 more events
  const previewEvts = events.slice(1, 5);
  const previewRows = previewEvts
    .map((e) => {
      const icon =
        e.event_type === "price_move"
          ? ""
          : (EVENT_ICONS[e.event_type] ?? "📌") + " ";
      return `<tr><td style="padding:4px 0;font-size:13px;color:#9ca3af;">${icon}${renderDigestLine(e, locale)}</td></tr>`;
    })
    .join("");

  const moreCount = events.length - 5;
  const moreRow =
    moreCount > 0
      ? `<tr><td style="padding:4px 0;font-size:12px;color:#c4c4c4;">+${moreCount} ${t(lang, "freeMore")}</td></tr>`
      : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  ${previewText(preview)}
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
    <div style="background:#4f46e5;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">${t(lang, "freeTitle")}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Vectorial Data</p>
    </div>
    <div style="padding:20px 24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.5;">${t(lang, "greeting")}</p>
      ${summaryHtml}
      <p style="margin:16px 0 4px;font-size:15px;font-weight:600;color:#111827;">${featIcon}${featLine}</p>
      ${explanationHtml}
      ${previewEvts.length > 0 ? `
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e4e4e7;">
        <table style="width:100%;border-collapse:collapse;">${previewRows}${moreRow}</table>
      </div>` : ""}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e4e4e7;text-align:center;">
      <a href="${SITE}/join" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">${t(lang, "freeCta")}</a>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #f4f4f5;">
      <p style="margin:0;font-size:13px;color:#6b7280;">${t(lang, "signoff")}</p>
    </div>
    <div style="padding:12px 24px;text-align:center;font-size:11px;color:#a1a1aa;">
      <p style="margin:0;">Vectorial Data — <a href="${SITE}" style="color:#a1a1aa;">vectorialdata.com</a></p>
      <p style="margin:4px 0 0;">${t(lang, "footer")}</p>
    </div>
  </div>
</body>
</html>`;
}

// --- Approval preview email (admin only) ---

export async function sendDigestApprovalEmail(
  adminEmail: string,
  events: PortfolioEvent[],
  approveUrl: string,
  weekKey: string,
  recipientCount: number,
  premiumCount: number,
  summary: DigestSummary | null
) {
  const freeCount = recipientCount - premiumCount;
  const digestPreview = buildDigestHtml(events, "es", summary);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#f59e0b;border-radius:12px 12px 0 0;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">PREVIEW — Digest ${weekKey}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Esperando tu aprobación para enviar</p>
    </div>
    <div style="background:#fff;padding:16px 24px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
      <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
        <p style="margin:0;font-size:13px;color:#92400e;font-weight:500;">${events.length} eventos | ${recipientCount} destinatarios (${premiumCount} premium, ${freeCount} free)</p>
      </div>
      <p style="margin:0 0 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;">Así se verá el digest premium:</p>
    </div>
    <div style="border:2px dashed #d4d4d8;border-radius:8px;margin:0 0 16px;overflow:hidden;">
      ${digestPreview}
    </div>
    <div style="text-align:center;padding:16px;">
      <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">Aprobar y Enviar</a>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Si no apruebas, no se envía nada.</p>
    </div>
  </div>
</body>
</html>`;

  const subject = `[APROBAR] Digest ${weekKey} — ${events.length} eventos, ${recipientCount} usuarios`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject,
    html,
  });

  if (error)
    throw new Error(`Failed to send approval email: ${error.message}`);
}

// --- Send digest to a user ---

export async function sendDigestEmail(
  to: string,
  events: PortfolioEvent[],
  locale = "en",
  isSubscribed = true,
  summary: DigestSummary | null = null
) {
  const subject = generateDynamicSubject(events, summary, locale);

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: isSubscribed
      ? buildDigestHtml(events, locale, summary)
      : buildFreeDigestHtml(events, locale, summary),
  });

  if (error) throw new Error(`Failed to send digest: ${error.message}`);
}

// --- Pick email ---

const PICK_L: Record<string, Record<string, string>> = {
  es: {
    subject: "Stock Pick #{pick} — {name}",
    header: "STOCK PICK #{pick}",
    date: "{date}",
    priceLabel: "Precio",
    whatTheyDo: "Qué hacen",
    income: "Tu nuevo ingreso",
    incomeDesc: "Esta empresa te paga {yield}% anual solo por ser dueño.",
    noDiv: "{name} no paga dividendo todavía, pero tu ganancia viene del crecimiento del negocio.",
    risk: "El riesgo",
    position: "Posición #{pick}",
    viewResearch: "Ver research completo",
    verified: "Certificado por blockchain",
    verifyLink: "Verificar",
    footer: "Esto no es consejo de inversión.",
    signoff: "— El equipo de Vectorial Data",
    type_new: "Nueva",
    type_rebuy: "Recompra",
  },
  en: {
    subject: "Stock Pick #{pick} — {name}",
    header: "STOCK PICK #{pick}",
    date: "{date}",
    priceLabel: "Price",
    whatTheyDo: "What they do",
    income: "Your new income",
    incomeDesc: "This company pays you {yield}% per year just for owning it.",
    noDiv: "{name} doesn't pay a dividend yet, but your gain comes from business growth.",
    risk: "The risk",
    position: "Position #{pick}",
    viewResearch: "View full research",
    verified: "Blockchain certified",
    verifyLink: "Verify",
    footer: "This is not investment advice.",
    signoff: "— The Vectorial Data team",
    type_new: "New",
    type_rebuy: "Rebuy",
  },
  pt: {
    subject: "Stock Pick #{pick} — {name}",
    header: "STOCK PICK #{pick}",
    date: "{date}",
    priceLabel: "Preço",
    whatTheyDo: "O que fazem",
    income: "Sua nova renda",
    incomeDesc: "Esta empresa te paga {yield}% ao ano só por ser dono.",
    noDiv: "{name} ainda não paga dividendos, mas seu ganho vem do crescimento do negócio.",
    risk: "O risco",
    position: "Posição #{pick}",
    viewResearch: "Ver research completo",
    verified: "Certificado por blockchain",
    verifyLink: "Verificar",
    footer: "Isto não é conselho de investimento.",
    signoff: "— A equipe Vectorial Data",
    type_new: "Nova",
    type_rebuy: "Recompra",
  },
  hi: {
    subject: "Stock Pick #{pick} — {name}",
    header: "STOCK PICK #{pick}",
    date: "{date}",
    priceLabel: "कीमत",
    whatTheyDo: "यह कंपनी क्या करती है",
    income: "आपकी नई आय",
    incomeDesc: "यह कंपनी आपको मालिक होने के लिए सालाना {yield}% देती है।",
    noDiv: "{name} अभी लाभांश नहीं देता, लेकिन आपका लाभ व्यवसाय वृद्धि से आता है।",
    risk: "जोखिम",
    position: "पोजीशन #{pick}",
    viewResearch: "पूरा रिसर्च देखें",
    verified: "ब्लॉकचेन प्रमाणित",
    verifyLink: "सत्यापित करें",
    footer: "यह निवेश सलाह नहीं है।",
    signoff: "— Vectorial Data टीम",
    type_new: "नई",
    type_rebuy: "पुनर्खरीद",
  },
};

function pickT(locale: string, key: string): string {
  return PICK_L[locale]?.[key] ?? PICK_L.en[key] ?? key;
}

function buildPickEmailHtml(
  stock: Stock,
  pickNumber: number,
  tx: Transaction,
  locale = "es"
): string {
  const lang = PICK_L[locale] ? locale : "es";
  const name = stock.name.replace(/ (PLC|Inc\.|Ltd\.|S\.A\.|AG|N\.V\.|Corporation|Company)\.?$/i, "");
  const typeBadgeColor = tx.type === "new" ? "#4f46e5" : "#16a34a";
  const typeLabel = tx.type === "new" ? pickT(lang, "type_new") : pickT(lang, "type_rebuy");

  const incomeLine = stock.dividend_yield && stock.dividend_yield > 0
    ? pickT(lang, "incomeDesc").replace("{yield}", stock.dividend_yield.toFixed(1))
    : pickT(lang, "noDiv").replace("{name}", name);

  const riskLine = stock.summary_risk?.split(".")[0] || "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  ${previewText(`Stock Pick #${pickNumber} — ${name} ($${stock.price?.toFixed(2)})`)}
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
    <div style="background:#4f46e5;padding:20px 24px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">${pickT(lang, "header").replace("{pick}", String(pickNumber))}</h1>
        <span style="background:${typeBadgeColor};color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;text-transform:uppercase;">${typeLabel}</span>
      </div>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${tx.date}</p>
    </div>
    <div style="padding:20px 24px;">
      <!-- Company + Price -->
      <div style="margin-bottom:20px;">
        <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">${name}</h2>
        <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">${stock.ticker} · ${stock.sector} · ${stock.country}</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:#111827;">$${stock.price?.toFixed(2)}</p>
      </div>

      <!-- What they do -->
      ${stock.summary_what ? `
      <div style="margin-bottom:16px;padding:12px 16px;background:#f0f0ff;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:0.5px;">${pickT(lang, "whatTheyDo")}</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.5;">${stock.summary_what}</p>
      </div>` : ""}

      <!-- Income -->
      <div style="margin-bottom:16px;padding:12px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px;">${pickT(lang, "income")}</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.5;">${incomeLine}</p>
      </div>

      <!-- Risk -->
      ${riskLine ? `
      <div style="margin-bottom:16px;padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.5px;">${pickT(lang, "risk")}</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.5;">${riskLine}.</p>
      </div>` : ""}

      <!-- Position badge -->
      <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">${pickT(lang, "position").replace("{pick}", String(pickNumber))}</p>

      <!-- Blockchain verified badge -->
      <div style="margin:12px 0 0;padding:8px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;display:inline-block;">
        <span style="font-size:13px;color:#16a34a;font-weight:500;">&#10003; ${pickT(lang, "verified")}</span>
        <span style="font-size:12px;color:#6b7280;"> · </span>
        <a href="${SITE}/verify/${stock.ticker}" style="font-size:12px;color:#4f46e5;text-decoration:underline;">${pickT(lang, "verifyLink")}</a>
      </div>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e4e4e7;text-align:center;">
      <a href="${SITE}/stocks/${stock.ticker}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">${pickT(lang, "viewResearch")}</a>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #f4f4f5;">
      <p style="margin:0;font-size:13px;color:#6b7280;">${pickT(lang, "signoff")}</p>
    </div>
    <div style="padding:12px 24px;text-align:center;font-size:11px;color:#a1a1aa;">
      <p style="margin:0;">Vectorial Data — <a href="${SITE}" style="color:#a1a1aa;">vectorialdata.com</a></p>
      <p style="margin:4px 0 0;">${pickT(lang, "footer")}</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendPickApprovalEmail(
  adminEmail: string,
  stock: Stock,
  pickNumber: number,
  tx: Transaction,
  approveUrl: string,
  recipientCount: number
) {
  const name = stock.name.replace(/ (PLC|Inc\.|Ltd\.|S\.A\.|AG|N\.V\.|Corporation|Company)\.?$/i, "");
  const pickPreview = buildPickEmailHtml(stock, pickNumber, tx, "es");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#f59e0b;border-radius:12px 12px 0 0;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">PREVIEW — Pick #${pickNumber} (${name})</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Esperando tu aprobacion para enviar</p>
    </div>
    <div style="background:#fff;padding:16px 24px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
      <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
        <p style="margin:0;font-size:13px;color:#92400e;font-weight:500;">${stock.ticker} · ${tx.type === "new" ? "Nueva" : "Recompra"} · $${stock.price?.toFixed(2)} · ${recipientCount} destinatarios email</p>
      </div>
      <p style="margin:0 0 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;">Asi se vera el email del pick:</p>
    </div>
    <div style="border:2px dashed #d4d4d8;border-radius:8px;margin:0 0 16px;overflow:hidden;">
      ${pickPreview}
    </div>
    <div style="text-align:center;padding:16px;">
      <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">Aprobar y Enviar</a>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Si no apruebas, no se envia nada.</p>
    </div>
  </div>
</body>
</html>`;

  const subject = `[APROBAR] Pick #${pickNumber} — ${name} (${stock.ticker}) — ${recipientCount} usuarios`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject,
    html,
  });

  if (error)
    throw new Error(`Failed to send pick approval email: ${error.message}`);
}

export async function sendPickEmail(
  to: string,
  stock: Stock,
  pickNumber: number,
  tx: Transaction,
  locale = "es"
) {
  const name = stock.name.replace(/ (PLC|Inc\.|Ltd\.|S\.A\.|AG|N\.V\.|Corporation|Company)\.?$/i, "");
  const lang = PICK_L[locale] ? locale : "es";
  const subject = pickT(lang, "subject")
    .replace("{pick}", String(pickNumber))
    .replace("{name}", name) + " — Vectorial Data";

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: buildPickEmailHtml(stock, pickNumber, tx, locale),
  });

  if (error) throw new Error(`Failed to send pick email: ${error.message}`);
}

// ─── Analytics Digest (admin-only weekly report) ───

export interface AnalyticsDigestData {
  portfolioReturnPct: number | null;
  weeklyChangePct: number | null;
  bestStock: { ticker: string; returnPct: number } | null;
  worstStock: { ticker: string; returnPct: number } | null;
  totalBotVisits: number;
  botBreakdown: { bot_name: string; count: number }[];
  topCrawledPages: { url: string; count: number }[];
  prevWeekBotVisits: number;
  totalSubscribers: number;
  newSubscribersThisWeek: number;
  premiumCount: number;
  freeCount: number;
  totalApiKeys: number;
  activeApiKeysThisWeek: number;
  totalRequestsToday: number;
  weekStart: string;
  weekEnd: string;
  ga4?: {
    pageViews: number;
    sessions: number;
    users: number;
    newUsers: number;
    topPages: { path: string; views: number }[];
    topCountries: { country: string; users: number }[];
    trafficSources: { source: string; sessions: number }[];
    devices: { device: string; sessions: number }[];
  } | null;
  gsc?: {
    totalClicks: number;
    totalImpressions: number;
    averageCTR: number;
    averagePosition: number;
    topQueries: { query: string; clicks: number; impressions: number; position: number }[];
    topPages: { page: string; clicks: number; impressions: number }[];
  } | null;
}

function buildAnalyticsDigestHtml(data: AnalyticsDigestData): string {
  const {
    portfolioReturnPct, weeklyChangePct, bestStock, worstStock,
    totalBotVisits, botBreakdown, topCrawledPages, prevWeekBotVisits,
    totalSubscribers, newSubscribersThisWeek, premiumCount, freeCount,
    totalApiKeys, activeApiKeysThisWeek, totalRequestsToday,
    weekStart, weekEnd,
  } = data;

  const pctSign = (portfolioReturnPct ?? 0) >= 0 ? "+" : "";
  const pctColor = (portfolioReturnPct ?? 0) >= 0 ? "#16a34a" : "#dc2626";
  const weekSign = (weeklyChangePct ?? 0) >= 0 ? "+" : "";
  const weekColor = (weeklyChangePct ?? 0) >= 0 ? "#16a34a" : "#dc2626";
  const heroBg = (portfolioReturnPct ?? 0) >= 0 ? "#f0fdf4" : "#fef2f2";
  const heroBorder = (portfolioReturnPct ?? 0) >= 0 ? "#bbf7d0" : "#fecaca";

  const heroSection = `
    <div style="background:${heroBg};border:1px solid ${heroBorder};border-radius:8px;padding:14px 16px;margin-bottom:16px;">
      <p style="margin:0;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">PORTFOLIO ALL-TIME</p>
      <p style="margin:4px 0 0;font-size:32px;font-weight:700;color:${pctColor};">${pctSign}${(portfolioReturnPct ?? 0).toFixed(2)}%</p>
      <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">This week: <span style="color:${weekColor};font-weight:600;">${weekSign}${(weeklyChangePct ?? 0).toFixed(2)}%</span></p>
      ${bestStock ? `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Best: <strong>${bestStock.ticker}</strong> ${bestStock.returnPct >= 0 ? "+" : ""}${bestStock.returnPct.toFixed(1)}% &nbsp;|&nbsp; Worst: <strong>${worstStock?.ticker ?? "—"}</strong> ${worstStock ? (worstStock.returnPct >= 0 ? "+" : "") + worstStock.returnPct.toFixed(1) + "%" : "—"}</p>` : ""}
    </div>`;

  // Bot activity
  const botTrend = prevWeekBotVisits > 0
    ? ((totalBotVisits - prevWeekBotVisits) / prevWeekBotVisits * 100).toFixed(0)
    : null;
  const botTrendStr = botTrend !== null
    ? ` (<span style="color:${Number(botTrend) >= 0 ? "#16a34a" : "#dc2626"}">${Number(botTrend) >= 0 ? "+" : ""}${botTrend}%</span> vs last week)`
    : " (first week)";
  const botRows = botBreakdown.slice(0, 8).map(b =>
    `<tr><td style="padding:3px 0;font-size:13px;">${b.bot_name}</td><td style="padding:3px 0;font-size:13px;text-align:right;font-weight:600;">${b.count}</td></tr>`
  ).join("");
  const pageRows = topCrawledPages.slice(0, 5).map(p =>
    `<tr><td style="padding:3px 0;font-size:12px;color:#6b7280;word-break:break-all;">${p.url}</td><td style="padding:3px 0;font-size:12px;text-align:right;white-space:nowrap;">${p.count}</td></tr>`
  ).join("");

  const crawlerSection = `
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f4f4f5;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">AI CRAWLER ACTIVITY</p>
      <p style="margin:0 0 8px;font-size:14px;"><strong>${totalBotVisits}</strong> visits${botTrendStr}</p>
      ${botRows ? `<table style="width:100%;border-collapse:collapse;">${botRows}</table>` : "<p style='font-size:13px;color:#9ca3af;'>No bot visits this week</p>"}
      ${pageRows ? `<p style="margin:12px 0 4px;font-size:11px;color:#9ca3af;font-weight:600;">TOP PAGES CRAWLED</p><table style="width:100%;border-collapse:collapse;">${pageRows}</table>` : ""}
    </div>`;

  // Subscribers
  const growthRate = totalSubscribers > 0 ? ((newSubscribersThisWeek / totalSubscribers) * 100).toFixed(1) : "0";
  const subscriberSection = `
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f4f4f5;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">SUBSCRIBERS</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:3px 0;font-size:13px;">Total</td><td style="text-align:right;font-weight:600;font-size:13px;">${totalSubscribers}</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">New this week</td><td style="text-align:right;font-weight:600;font-size:13px;color:#16a34a;">+${newSubscribersThisWeek}</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">Premium / Free</td><td style="text-align:right;font-size:13px;">${premiumCount} / ${freeCount}</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">Growth rate</td><td style="text-align:right;font-size:13px;">${growthRate}%</td></tr>
      </table>
    </div>`;

  // API
  const apiSection = `
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f4f4f5;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">API USAGE</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:3px 0;font-size:13px;">Total API keys</td><td style="text-align:right;font-weight:600;font-size:13px;">${totalApiKeys}</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">Active this week</td><td style="text-align:right;font-size:13px;">${activeApiKeysThisWeek}</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">Requests today</td><td style="text-align:right;font-weight:600;font-size:13px;">${totalRequestsToday}</td></tr>
      </table>
    </div>`;

  // GA4 section
  let ga4Section = "";
  if (data.ga4) {
    const g = data.ga4;
    const pageRows = g.topPages.slice(0, 5).map(p =>
      `<tr><td style="padding:3px 0;font-size:12px;color:#374151;word-break:break-all;">${p.path}</td><td style="padding:3px 0;font-size:12px;text-align:right;font-weight:600;">${p.views.toLocaleString()}</td></tr>`
    ).join("");

    // Country bars
    const maxCountryUsers = Math.max(...g.topCountries.slice(0, 5).map(c => c.users), 1);
    const countryBars = g.topCountries.slice(0, 5).map(c => {
      const pct = Math.round((c.users / maxCountryUsers) * 100);
      return `<div style="margin-bottom:4px;">
        <div style="font-size:11px;color:#6b7280;margin-bottom:1px;"><span>${c.country}</span> <span style="float:right;font-weight:600;color:#374151;">${c.users}</span></div>
        <div style="background:#f4f4f5;border-radius:3px;height:6px;overflow:hidden;">
          <div style="background:#4f46e5;width:${pct}%;height:100%;border-radius:3px;"></div>
        </div>
      </div>`;
    }).join("");

    // Traffic source bars
    const sourceBars = g.trafficSources?.length > 0 ? buildSourceBars(g.trafficSources) : "";

    // Device split
    const totalDeviceSessions = (g.devices ?? []).reduce((s, d) => s + d.sessions, 0);
    const deviceBars = totalDeviceSessions > 0 ? (g.devices ?? []).map(d => {
      const pct = Math.round((d.sessions / totalDeviceSessions) * 100);
      const colors: Record<string, string> = { mobile: "#4f46e5", desktop: "#16a34a", tablet: "#f59e0b" };
      const c = colors[d.device.toLowerCase()] ?? "#6b7280";
      return `<div style="display:inline-block;margin-right:16px;font-size:12px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:4px;vertical-align:middle;"></span>
        <span style="color:#374151;font-weight:600;">${d.device}</span>
        <span style="color:#6b7280;"> ${pct}%</span>
        <span style="color:#9ca3af;"> (${d.sessions})</span>
      </div>`;
    }).join("") : "";

    ga4Section = `
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f4f4f5;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">WEBSITE TRAFFIC (GA4)</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:3px 0;font-size:13px;">Page views</td><td style="text-align:right;font-weight:600;font-size:13px;">${g.pageViews.toLocaleString()}</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">Sessions</td><td style="text-align:right;font-size:13px;">${g.sessions.toLocaleString()}</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">Users</td><td style="text-align:right;font-size:13px;">${g.users.toLocaleString()}</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">New users</td><td style="text-align:right;font-size:13px;color:#16a34a;">${g.newUsers.toLocaleString()}</td></tr>
      </table>
      ${sourceBars ? `<p style="margin:14px 0 6px;font-size:11px;color:#9ca3af;font-weight:600;">TRAFFIC SOURCES</p>${sourceBars}` : ""}
      ${deviceBars ? `<p style="margin:14px 0 6px;font-size:11px;color:#9ca3af;font-weight:600;">DEVICES</p><div style="margin-top:4px;">${deviceBars}</div>` : ""}
      ${countryBars ? `<p style="margin:14px 0 6px;font-size:11px;color:#9ca3af;font-weight:600;">TOP COUNTRIES</p>${countryBars}` : ""}
      ${pageRows ? `<p style="margin:14px 0 4px;font-size:11px;color:#9ca3af;font-weight:600;">TOP PAGES</p><table style="width:100%;border-collapse:collapse;">${pageRows}</table>` : ""}
    </div>`;
  }

  // GSC section
  let gscSection = "";
  if (data.gsc) {
    const s = data.gsc;
    const queryRows = s.topQueries.slice(0, 8).map(q =>
      `<tr><td style="padding:3px 0;font-size:12px;color:#374151;">${q.query}</td><td style="padding:3px 0;font-size:12px;text-align:right;">${q.clicks}</td><td style="padding:3px 0;font-size:12px;text-align:right;color:#6b7280;">${q.impressions.toLocaleString()}</td><td style="padding:3px 0;font-size:12px;text-align:right;color:#6b7280;">${q.position}</td></tr>`
    ).join("");
    gscSection = `
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f4f4f5;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">GOOGLE SEARCH (GSC)</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:3px 0;font-size:13px;">Clicks</td><td style="text-align:right;font-weight:600;font-size:13px;">${s.totalClicks.toLocaleString()}</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">Impressions</td><td style="text-align:right;font-size:13px;">${s.totalImpressions.toLocaleString()}</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">CTR</td><td style="text-align:right;font-size:13px;">${s.averageCTR.toFixed(1)}%</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">Avg position</td><td style="text-align:right;font-size:13px;">${s.averagePosition.toFixed(1)}</td></tr>
      </table>
      ${queryRows ? `<p style="margin:12px 0 4px;font-size:11px;color:#9ca3af;font-weight:600;">TOP QUERIES</p><table style="width:100%;border-collapse:collapse;"><tr><td style="font-size:10px;color:#9ca3af;padding:0 0 4px;">Query</td><td style="font-size:10px;color:#9ca3af;text-align:right;padding:0 0 4px;">Clicks</td><td style="font-size:10px;color:#9ca3af;text-align:right;padding:0 0 4px;">Impr</td><td style="font-size:10px;color:#9ca3af;text-align:right;padding:0 0 4px;">Pos</td></tr>${queryRows}</table>` : ""}
    </div>`;
  }

  // Quick links
  const links = [
    { label: "Google Analytics 4", url: "https://analytics.google.com" },
    { label: "Vercel Analytics", url: "https://vercel.com/arcanequants/stock-picking/analytics" },
    { label: "Google Search Console", url: "https://search.google.com/search-console?resource_id=sc-domain:vectorialdata.com" },
    { label: "Marketing Dashboard", url: "https://www.vectorialdata.com/marketing" },
  ];
  const linkRows = links.map(l =>
    `<tr><td style="padding:4px 0;font-size:13px;"><a href="${l.url}" style="color:#4f46e5;text-decoration:none;">${l.label} →</a></td></tr>`
  ).join("");
  const quickLinksSection = `
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f4f4f5;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">QUICK LINKS</p>
      <table style="width:100%;border-collapse:collapse;">${linkRows}</table>
    </div>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  ${previewText(`Portfolio ${pctSign}${(portfolioReturnPct ?? 0).toFixed(2)}%. ${totalBotVisits} bot visits. ${newSubscribersThisWeek} new subs.`)}
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
    <div style="background:#111827;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">Weekly Analytics Digest</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">${weekStart} — ${weekEnd}</p>
    </div>
    <div style="padding:20px 24px;">
      ${heroSection}
      ${ga4Section}
      ${gscSection}
      ${crawlerSection}
      ${subscriberSection}
      ${apiSection}
      ${quickLinksSection}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #f4f4f5;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Vectorial Data — Weekly Analytics Report</p>
    </div>
  </div>
</body></html>`;
}

// ─── Daily Brief (founder dashboard email) ───

export interface DayMetric {
  label: string; // "04-03"
  value: number;
}

export interface DailyBriefData {
  date: string;
  portfolioReturnPct: number;
  dailyChangePct: number;
  totalBotVisits: number;
  yesterdayBotVisits: number;
  totalSubscribers: number;
  newSubscribersToday: number;
  totalApiKeys: number;
  totalRequestsToday: number;
  portfolioSparkline: DayMetric[];
  botSparkline: DayMetric[];
  traffic?: {
    pageViews: number;
    sessions: number;
    users: number;
    newUsers: number;
    topSource: string;
    topSourceSessions: number;
    sources: { source: string; sessions: number }[];
  } | null;
}

function buildSparkBars(data: DayMetric[], color: string, height = 32): string {
  if (data.length === 0) return "";
  // Skip if all values are 0 except maybe 1
  const nonZero = data.filter(d => d.value !== 0);
  if (nonZero.length <= 1) return "";

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal;

  const barWidth = Math.floor(100 / Math.max(data.length, 1));
  const bars = data.map(d => {
    // Use range-based scaling so similar values show visible differences
    const normalized = range > 0 ? (d.value - minVal) / range : 0.5;
    const h = Math.max(Math.round(normalized * height * 0.8 + height * 0.2), 3);
    const barColor = d.value >= 0 ? color : "#dc2626";
    return `<td style="vertical-align:bottom;padding:0 1px;width:${barWidth}%;">
      <div title="${d.label}: ${typeof d.value === 'number' && d.value % 1 !== 0 ? d.value.toFixed(2) : d.value}" style="background:${barColor};height:${h}px;border-radius:2px 2px 0 0;opacity:0.7;"></div>
      <div style="font-size:8px;color:#9ca3af;text-align:center;margin-top:2px;">${d.label.slice(3)}</div>
    </td>`;
  }).join("");
  return `<table style="width:100%;border-collapse:collapse;height:${height + 14}px;"><tr>${bars}</tr></table>`;
}

function buildSourceBars(sources: { source: string; sessions: number }[]): string {
  if (sources.length === 0) return "";
  const max = Math.max(...sources.map(s => s.sessions), 1);
  const colors: Record<string, string> = {
    "Organic Search": "#16a34a",
    "Direct": "#4f46e5",
    "Organic Social": "#ec4899",
    "Referral": "#f59e0b",
    "Paid Search": "#06b6d4",
    "Email": "#8b5cf6",
  };
  return sources.slice(0, 4).map(s => {
    const pct = Math.round((s.sessions / max) * 100);
    const c = colors[s.source] ?? "#6b7280";
    return `<div style="margin-bottom:4px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#6b7280;margin-bottom:1px;">
        <span>${s.source}</span><span style="font-weight:600;color:#374151;">${s.sessions}</span>
      </div>
      <div style="background:#f4f4f5;border-radius:3px;height:6px;overflow:hidden;">
        <div style="background:${c};width:${pct}%;height:100%;border-radius:3px;"></div>
      </div>
    </div>`;
  }).join("");
}

function buildNarrative(data: DailyBriefData): string {
  const parts: string[] = [];

  // Portfolio
  if (data.dailyChangePct > 0.1) parts.push(`Portfolio up ${data.dailyChangePct.toFixed(2)}% today`);
  else if (data.dailyChangePct < -0.1) parts.push(`Portfolio down ${Math.abs(data.dailyChangePct).toFixed(2)}% today`);
  else parts.push("Portfolio steady");

  // Bots
  if (data.totalBotVisits > 0) {
    const botChange = data.yesterdayBotVisits > 0
      ? Math.round(((data.totalBotVisits - data.yesterdayBotVisits) / data.yesterdayBotVisits) * 100)
      : null;
    if (botChange !== null && botChange > 50) parts.push(`${data.totalBotVisits} bot visits (spike!)`);
    else parts.push(`${data.totalBotVisits} bot visits`);
  }

  // Subscribers
  if (data.newSubscribersToday > 0) parts.push(`${data.newSubscribersToday} new signup${data.newSubscribersToday > 1 ? "s" : ""}!`);
  else parts.push("0 new signups");

  return parts.join(". ") + ".";
}

function buildAlerts(data: DailyBriefData): string {
  const alerts: string[] = [];

  // Bot spike
  if (data.yesterdayBotVisits > 0) {
    const change = ((data.totalBotVisits - data.yesterdayBotVisits) / data.yesterdayBotVisits) * 100;
    if (change > 50) alerts.push(`<tr><td style="padding:4px 8px;font-size:13px;">&#128293; Bot visits up ${Math.round(change)}% vs yesterday</td></tr>`);
  }
  if (data.totalBotVisits > 0 && data.yesterdayBotVisits === 0) {
    alerts.push(`<tr><td style="padding:4px 8px;font-size:13px;">&#128293; First bot visits today: ${data.totalBotVisits}</td></tr>`);
  }

  // New subscriber
  if (data.newSubscribersToday > 0) {
    alerts.push(`<tr><td style="padding:4px 8px;font-size:13px;">&#127881; ${data.newSubscribersToday} new subscriber${data.newSubscribersToday > 1 ? "s" : ""} today!</td></tr>`);
  }

  // Portfolio move
  if (Math.abs(data.dailyChangePct) > 1) {
    const emoji = data.dailyChangePct > 0 ? "&#128640;" : "&#9888;&#65039;";
    alerts.push(`<tr><td style="padding:4px 8px;font-size:13px;">${emoji} Portfolio moved ${data.dailyChangePct > 0 ? "+" : ""}${data.dailyChangePct.toFixed(2)}% today</td></tr>`);
  }

  if (alerts.length === 0) return "";
  return `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:14px;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">${alerts.join("")}</table>
  </div>`;
}

function metricCard(label: string, value: string, detail: string, bg: string, border: string, valueColor = "#111827"): string {
  return `<td style="width:50%;padding:4px;">
    <div style="background:${bg};border:1px solid ${border};border-radius:8px;padding:10px 12px;">
      <p style="margin:0;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
      <p style="margin:3px 0 0;font-size:22px;font-weight:700;color:${valueColor};">${value}</p>
      <p style="margin:2px 0 0;font-size:11px;color:#9ca3af;">${detail}</p>
    </div>
  </td>`;
}

function buildDailyBriefHtml(data: DailyBriefData): string {
  const { date, portfolioReturnPct, dailyChangePct, totalBotVisits, yesterdayBotVisits, totalSubscribers, newSubscribersToday, totalApiKeys, totalRequestsToday, portfolioSparkline, botSparkline } = data;

  const pctSign = portfolioReturnPct >= 0 ? "+" : "";
  const pctColor = portfolioReturnPct >= 0 ? "#16a34a" : "#dc2626";
  const daySign = dailyChangePct >= 0 ? "+" : "";
  const dayColor = dailyChangePct >= 0 ? "#16a34a" : "#dc2626";

  const narrative = buildNarrative(data);
  const alerts = buildAlerts(data);

  // Bot trend vs yesterday
  const botTrend = yesterdayBotVisits > 0
    ? `${totalBotVisits >= yesterdayBotVisits ? "+" : ""}${totalBotVisits - yesterdayBotVisits} vs ayer`
    : "first day";

  // Subscriber detail
  const subDetail = newSubscribersToday > 0
    ? `+${newSubscribersToday} new today`
    : "0 new today";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  ${previewText(`${narrative}`)}
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
    <!-- Header -->
    <div style="background:#111827;padding:14px 20px;">
      <table style="width:100%;"><tr>
        <td style="color:#fff;font-size:15px;font-weight:600;">Daily Brief</td>
        <td style="color:rgba(255,255,255,0.5);font-size:13px;text-align:right;">${date}</td>
      </tr></table>
    </div>
    <div style="padding:16px 20px;">
      <!-- Narrative -->
      <p style="margin:0 0 14px;font-size:14px;color:#374151;line-height:1.5;">${narrative}</p>

      <!-- Alerts -->
      ${alerts}

      <!-- Metric Cards -->
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          ${metricCard(
            "Portfolio",
            `${pctSign}${portfolioReturnPct.toFixed(2)}%`,
            `<span style="color:${dayColor}">${daySign}${dailyChangePct.toFixed(2)}%</span> today`,
            portfolioReturnPct >= 0 ? "#f0fdf4" : "#fef2f2",
            portfolioReturnPct >= 0 ? "#bbf7d0" : "#fecaca",
            pctColor
          )}
          ${metricCard(
            "Subscribers",
            String(totalSubscribers),
            subDetail,
            newSubscribersToday > 0 ? "#f0fdf4" : "#f9fafb",
            newSubscribersToday > 0 ? "#bbf7d0" : "#e4e4e7",
          )}
        </tr>
        <tr>
          ${metricCard(
            "Bot Visits",
            String(totalBotVisits),
            botTrend,
            totalBotVisits > yesterdayBotVisits && yesterdayBotVisits > 0 ? "#eff6ff" : "#f9fafb",
            totalBotVisits > yesterdayBotVisits && yesterdayBotVisits > 0 ? "#bfdbfe" : "#e4e4e7",
          )}
          ${data.traffic ? metricCard(
            "Traffic",
            String(data.traffic.pageViews),
            `${data.traffic.sessions} sessions · ${data.traffic.users} users`,
            "#f9fafb",
            "#e4e4e7",
          ) : metricCard(
            "API",
            `${totalApiKeys} keys`,
            `${totalRequestsToday} requests today`,
            "#f9fafb",
            "#e4e4e7",
          )}
        </tr>
        ${data.traffic ? `<tr>
          ${metricCard(
            "New Users",
            String(data.traffic.newUsers),
            "from GA4 yesterday",
            data.traffic.newUsers > 0 ? "#f0fdf4" : "#f9fafb",
            data.traffic.newUsers > 0 ? "#bbf7d0" : "#e4e4e7",
          )}
          ${metricCard(
            "API",
            `${totalApiKeys} keys`,
            `${totalRequestsToday} requests today`,
            "#f9fafb",
            "#e4e4e7",
          )}
        </tr>` : ""}
      </table>

      <!-- Traffic Sources -->
      ${data.traffic && data.traffic.sources.length > 0 ? `
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid #f4f4f5;">
        <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Traffic Sources — Yesterday</p>
        ${buildSourceBars(data.traffic.sources)}
      </div>` : ""}

      <!-- Portfolio Sparkline -->
      ${portfolioSparkline.length > 1 ? `
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid #f4f4f5;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Portfolio — Last 7 Days</p>
        ${buildSparkBars(portfolioSparkline, "#16a34a", 36)}
      </div>` : ""}

      <!-- Bot Sparkline -->
      ${botSparkline.some(b => b.value > 0) ? `
      <div style="margin-top:12px;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Bot Visits — Last 7 Days</p>
        ${buildSparkBars(botSparkline, "#4f46e5", 28)}
      </div>` : ""}
    </div>
    <!-- Footer -->
    <div style="padding:10px 20px;border-top:1px solid #f4f4f5;">
      <p style="margin:0;font-size:11px;color:#a1a1aa;text-align:center;">Vectorial Data — Daily Analytics Brief</p>
    </div>
  </div>
</body></html>`;
}

export async function sendDailyBrief(to: string, data: DailyBriefData) {
  const daySign = data.dailyChangePct >= 0 ? "+" : "";
  const pctSign = data.portfolioReturnPct >= 0 ? "+" : "";

  // Dynamic subject with alerts
  const alertParts: string[] = [];
  if (data.newSubscribersToday > 0) alertParts.push(`+${data.newSubscribersToday} sub`);
  if (data.yesterdayBotVisits > 0 && ((data.totalBotVisits - data.yesterdayBotVisits) / data.yesterdayBotVisits) > 0.5) alertParts.push("bot spike");
  if (Math.abs(data.dailyChangePct) > 1) alertParts.push(`portfolio ${daySign}${data.dailyChangePct.toFixed(1)}%`);
  const alertStr = alertParts.length > 0 ? ` [${alertParts.join(", ")}]` : "";

  const subject = `${pctSign}${data.portfolioReturnPct.toFixed(2)}% | ${data.totalBotVisits} bots | ${data.totalSubscribers} subs${alertStr}`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: buildDailyBriefHtml(data),
  });

  if (error) throw new Error(`Failed to send daily brief: ${error.message}`);
}

export async function sendAnalyticsDigest(to: string, data: AnalyticsDigestData) {
  const pctSign = (data.portfolioReturnPct ?? 0) >= 0 ? "+" : "";
  const subject = `Analytics: Portfolio ${pctSign}${(data.portfolioReturnPct ?? 0).toFixed(2)}% | ${data.totalBotVisits} bot visits | ${data.newSubscribersThisWeek} new subs`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: buildAnalyticsDigestHtml(data),
  });

  if (error) throw new Error(`Failed to send analytics digest: ${error.message}`);
}

// ── Magic Link Email (branded) ──────────────────────────────

const MAGIC_LINK_SUBJECTS: Record<string, string> = {
  es: "Tu portafolio está listo",
  en: "Your portfolio is ready",
  pt: "Seu portfólio está pronto",
  hi: "आपका पोर्टफोलियो तैयार है",
};

export async function sendMagicLinkEmail(
  email: string,
  magicLinkUrl: string,
  locale: string = "es"
): Promise<void> {
  const subject = MAGIC_LINK_SUBJECTS[locale] || MAGIC_LINK_SUBJECTS.es;

  const ctaText: Record<string, string> = {
    es: "Acceder a mi cuenta",
    en: "Access my account",
    pt: "Acessar minha conta",
    hi: "मेरे खाते तक पहुँचें",
  };

  const expiryText: Record<string, string> = {
    es: "Este enlace expira en 24 horas.",
    en: "This link expires in 24 hours.",
    pt: "Este link expira em 24 horas.",
    hi: "यह लिंक 24 घंटे में समाप्त हो जाएगा।",
  };

  const ignoreText: Record<string, string> = {
    es: "Si no solicitaste este acceso, ignora este correo.",
    en: "If you didn't request this, ignore this email.",
    pt: "Se você não solicitou isso, ignore este e-mail.",
    hi: "अगर आपने यह अनुरोध नहीं किया, तो इस ईमेल को अनदेखा करें।",
  };

  const l = locale in ctaText ? locale : "es";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;font-size:1px;color:#f9fafb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  ${l === "es" ? "Tu enlace de acceso seguro a Vectorial Data" : l === "en" ? "Your secure access link to Vectorial Data" : l === "pt" ? "Seu link de acesso seguro ao Vectorial Data" : "Vectorial Data तक आपकी सुरक्षित पहुँच"}
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
  <!-- Header -->
  <tr><td style="padding:32px 32px 24px;text-align:center;">
    <img src="${SITE}/logo.png" width="40" height="40" alt="Vectorial Data" style="display:inline-block;margin-bottom:12px;" />
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Vectorial Data</h1>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:0 32px 32px;">
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;text-align:center;">
      ${l === "es" ? "Tu portafolio te espera. Haz clic para entrar." : l === "en" ? "Your portfolio is waiting. Click to jump in." : l === "pt" ? "Seu portfólio está esperando. Clique para entrar." : "आपका पोर्टफोलियो आपका इंतज़ार कर रहा है। अंदर आने के लिए क्लिक करें।"}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${magicLinkUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:600;">
        ${ctaText[l]}
      </a>
    </td></tr></table>
    <p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center;">
      ${expiryText[l]}
    </p>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      ${ignoreText[l]}
    </p>
    <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">
      <a href="${SITE}" style="color:#4f46e5;text-decoration:none;">vectorialdata.com</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to: email,
    subject,
    html,
  });

  if (error) throw new Error(`Failed to send magic link email: ${error.message}`);
}

// ===== Support tickets =====

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendSupportTicketToAdmin(
  adminEmail: string,
  userEmail: string,
  category: string | null,
  message: string,
  ticketId: number
): Promise<void> {
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");
  const cat = category ? escapeHtml(category) : "—";

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
  <tr><td style="padding:24px 32px;background:#111827;color:#ffffff;">
    <p style="margin:0;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#9ca3af;">Support ticket #${ticketId}</p>
    <h1 style="margin:4px 0 0;font-size:18px;font-weight:600;">Category: ${cat}</h1>
  </td></tr>
  <tr><td style="padding:24px 32px;">
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">From</p>
    <p style="margin:0 0 20px;font-size:15px;color:#111827;font-weight:500;">${escapeHtml(userEmail)}</p>
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Message</p>
    <div style="font-size:15px;line-height:1.6;color:#111827;background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #e4e4e7;">${safeMessage}</div>
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">Reply directly to this email — it goes back to the user.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    replyTo: userEmail,
    subject: `[Ticket #${ticketId}] ${category ?? "Support"} — ${userEmail}`,
    html,
    text: `Ticket #${ticketId}\nFrom: ${userEmail}\nCategory: ${category ?? "—"}\n\n${message}\n\nReply directly to this email.`,
  });

  if (error) throw new Error(`Failed to send support ticket to admin: ${error.message}`);
}

export async function sendSupportTicketAck(
  userEmail: string,
  ticketId: number,
  locale: string = "es"
): Promise<void> {
  const L: Record<string, { subject: string; title: string; body: string; sla: string; footer: string }> = {
    es: {
      subject: `Recibimos tu mensaje — Ticket #${ticketId}`,
      title: "Recibimos tu mensaje",
      body: "Gracias por escribirnos. Leemos cada ticket personalmente.",
      sla: "Te respondemos en 1-2 días hábiles al correo con el que te registraste.",
      footer: "Este es un mensaje automático.",
    },
    en: {
      subject: `We got your message — Ticket #${ticketId}`,
      title: "We got your message",
      body: "Thanks for reaching out. We read every ticket personally.",
      sla: "You'll hear back from us within 1-2 business days at this email address.",
      footer: "This is an automated confirmation.",
    },
    pt: {
      subject: `Recebemos sua mensagem — Ticket #${ticketId}`,
      title: "Recebemos sua mensagem",
      body: "Obrigado por entrar em contato. Lemos cada ticket pessoalmente.",
      sla: "Respondemos em 1-2 dias úteis no email com que você se cadastrou.",
      footer: "Esta é uma confirmação automática.",
    },
    hi: {
      subject: `हमें आपका संदेश मिला — Ticket #${ticketId}`,
      title: "हमें आपका संदेश मिला",
      body: "संपर्क करने के लिए धन्यवाद। हम हर टिकट को व्यक्तिगत रूप से पढ़ते हैं।",
      sla: "हम 1-2 कार्य दिवसों में आपके पंजीकृत ईमेल पर उत्तर देंगे।",
      footer: "यह एक स्वचालित पुष्टि है।",
    },
  };

  const l = locale in L ? locale : "es";
  const c = L[l];

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
  <tr><td style="padding:32px 32px 24px;text-align:center;">
    <img src="${SITE}/logo.png" width="40" height="40" alt="Vectorial Data" style="display:inline-block;margin-bottom:12px;" />
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">${c.title}</h1>
  </td></tr>
  <tr><td style="padding:0 32px 32px;">
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${c.body}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${c.sla}</p>
    <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Ticket #${ticketId}</p>
  </td></tr>
  <tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">${c.footer}</p>
    <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">
      <a href="${SITE}" style="color:#4f46e5;text-decoration:none;">vectorialdata.com</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to: userEmail,
    subject: c.subject,
    html,
  });

  if (error) throw new Error(`Failed to send support ticket ack: ${error.message}`);
}

// ── Welcome Email (post-checkout) ───────────────────────────
// Copywriter + Retention + Email Designer collab.
// Hits the user at the peak anxiety moment (right after paying) with:
//   (1) confirmation ("listo"), (2) WA group button if chosen, (3) clear
//   expectations (when/how often/what format), (4) magic link for web,
//   (5) personal sign-off to invite replies.

type DeliveryChannel = "whatsapp" | "email" | "both";

const WELCOME_COPY: Record<
  string,
  {
    subject: string;
    heading: string;
    intro: string;
    channelLabel: string;
    channelWhatsApp: string;
    channelEmail: string;
    channelBoth: string;
    waCtaTitle: string;
    waCtaDesc: string;
    waButton: string;
    expectTitle: string;
    expectTiming: string;
    expectFrequency: string;
    expectFormat: string;
    expectAha: string;
    ruleTipTitle: string;
    ruleTipBody: string;
    ruleTipLink: string;
    webTitle: string;
    webDesc: string;
    webLink: string;
    webExpiry: string;
    sign: string;
    signRole: string;
    reply: string;
    footerLegal: string;
  }
> = {
  es: {
    subject: "Bienvenido a Vectorial Data. Tu primer pick llega pronto.",
    heading: "Listo — tu suscripción está activa.",
    intro: "Gracias por unirte. Aquí está todo lo que necesitas para empezar.",
    channelLabel: "Elegiste recibir por",
    channelWhatsApp: "WhatsApp",
    channelEmail: "Email",
    channelBoth: "WhatsApp y Email",
    waCtaTitle: "Únete al grupo de WhatsApp",
    waCtaDesc: "Este es el paso más importante. Sin esto, no recibirás los picks.",
    waButton: "Unirme al grupo",
    expectTitle: "Qué esperar",
    expectTiming: "Tu primer pick llega cuando haya uno nuevo — no hay pick todos los días.",
    expectFrequency: "Frecuencia: lunes a viernes, solo cuando hay una oportunidad real.",
    expectFormat: "Cada pick incluye: ticker, tesis, riesgo, y research completo en la web.",
    expectAha: "En un año harás cientos de compras pequeñas. La constancia es el truco — no el stock que escojas.",
    ruleTipTitle: "Antes del primer pick: define tu regla",
    ruleTipBody: "Decide un presupuesto mensual que no te duela mantener. Divídelo entre 30. Esa es la cantidad que inviertes en cada pick — siempre la misma.",
    ruleTipLink: "Definir mi regla en 30 segundos →",
    webTitle: "Accede a tu portafolio en la web",
    webDesc: "Gráficas, posiciones, transacciones y research completo.",
    webLink: "Acceder a mi cuenta →",
    webExpiry: "Este enlace expira en 24 horas.",
    sign: "— Alberto",
    signRole: "Fundador, Vectorial Data",
    reply: "¿Preguntas? Responde este email directo. Lo leo yo.",
    footerLegal: "Esto no es asesoría financiera. Todos los precios en USD.",
  },
  en: {
    subject: "Welcome to Vectorial Data. Your first pick is coming soon.",
    heading: "You're in — your subscription is active.",
    intro: "Thanks for joining. Here's everything you need to get started.",
    channelLabel: "You chose to receive by",
    channelWhatsApp: "WhatsApp",
    channelEmail: "Email",
    channelBoth: "WhatsApp and Email",
    waCtaTitle: "Join the WhatsApp group",
    waCtaDesc: "This is the most important step. Without this, you won't receive picks.",
    waButton: "Join the group",
    expectTitle: "What to expect",
    expectTiming: "Your first pick arrives when there's a new one — not every day has a pick.",
    expectFrequency: "Frequency: Monday through Friday, only when there's a real opportunity.",
    expectFormat: "Each pick includes: ticker, thesis, risk, and full research on the web.",
    expectAha: "In a year you'll make hundreds of small buys. The trick is consistency — not the stock you pick.",
    ruleTipTitle: "Before the first pick: set your rule",
    ruleTipBody: "Pick a monthly budget that won't hurt to keep up. Divide by 30. That's the amount you invest in every pick — always the same.",
    ruleTipLink: "Set my rule in 30 seconds →",
    webTitle: "Access your portfolio on the web",
    webDesc: "Charts, positions, transactions and full research.",
    webLink: "Access my account →",
    webExpiry: "This link expires in 24 hours.",
    sign: "— Alberto",
    signRole: "Founder, Vectorial Data",
    reply: "Questions? Reply to this email directly. I read every one.",
    footerLegal: "This is not investment advice. All prices in USD.",
  },
  pt: {
    subject: "Bem-vindo ao Vectorial Data. Seu primeiro pick chega em breve.",
    heading: "Pronto — sua assinatura está ativa.",
    intro: "Obrigado por entrar. Aqui está tudo que você precisa para começar.",
    channelLabel: "Você escolheu receber por",
    channelWhatsApp: "WhatsApp",
    channelEmail: "Email",
    channelBoth: "WhatsApp e Email",
    waCtaTitle: "Entre no grupo do WhatsApp",
    waCtaDesc: "Este é o passo mais importante. Sem isso, você não receberá picks.",
    waButton: "Entrar no grupo",
    expectTitle: "O que esperar",
    expectTiming: "Seu primeiro pick chega quando houver um novo — nem todo dia tem pick.",
    expectFrequency: "Frequência: segunda a sexta, só quando há uma oportunidade real.",
    expectFormat: "Cada pick inclui: ticker, tese, risco, e research completo na web.",
    expectAha: "Em um ano você fará centenas de compras pequenas. O truque é a constância — não o stock que você escolhe.",
    ruleTipTitle: "Antes do primeiro pick: defina sua regra",
    ruleTipBody: "Escolha um orçamento mensal que não doa manter. Divida por 30. Essa é a quantia que você investe em cada pick — sempre a mesma.",
    ruleTipLink: "Definir minha regra em 30 segundos →",
    webTitle: "Acesse seu portfólio na web",
    webDesc: "Gráficos, posições, transações e research completo.",
    webLink: "Acessar minha conta →",
    webExpiry: "Este link expira em 24 horas.",
    sign: "— Alberto",
    signRole: "Fundador, Vectorial Data",
    reply: "Dúvidas? Responda este email diretamente. Eu leio cada um.",
    footerLegal: "Isto não é conselho de investimento. Todos os preços em USD.",
  },
  hi: {
    subject: "Vectorial Data में आपका स्वागत है। आपका पहला pick जल्द आएगा।",
    heading: "हो गया — आपकी सदस्यता सक्रिय है।",
    intro: "शामिल होने के लिए धन्यवाद। शुरू करने के लिए यहाँ सब कुछ है।",
    channelLabel: "आपने चुना",
    channelWhatsApp: "WhatsApp",
    channelEmail: "ईमेल",
    channelBoth: "WhatsApp और ईमेल",
    waCtaTitle: "WhatsApp ग्रुप में शामिल हों",
    waCtaDesc: "यह सबसे महत्वपूर्ण कदम है। इसके बिना आपको picks नहीं मिलेंगे।",
    waButton: "ग्रुप में शामिल हों",
    expectTitle: "क्या अपेक्षा करें",
    expectTiming: "आपका पहला pick तब आएगा जब कोई नया होगा — हर दिन pick नहीं होता।",
    expectFrequency: "आवृत्ति: सोमवार से शुक्रवार, केवल जब कोई वास्तविक अवसर हो।",
    expectFormat: "हर pick में: ticker, थीसिस, जोखिम, और वेब पर पूरा research।",
    expectAha: "एक साल में आप सैकड़ों छोटी खरीदारी करेंगे। चाल निरंतरता है — आप जो stock चुनते हैं वो नहीं।",
    ruleTipTitle: "पहले pick से पहले: अपना नियम सेट करें",
    ruleTipBody: "एक मासिक बजट चुनें जिसे बनाए रखना मुश्किल न हो। 30 से विभाजित करें। यही वो राशि है जो आप हर pick में निवेश करते हैं — हमेशा वही।",
    ruleTipLink: "30 सेकंड में मेरा नियम सेट करें →",
    webTitle: "वेब पर अपना पोर्टफोलियो देखें",
    webDesc: "चार्ट, पोजीशन, लेनदेन और पूरा research।",
    webLink: "मेरे खाते तक पहुँचें →",
    webExpiry: "यह लिंक 24 घंटे में समाप्त हो जाएगा।",
    sign: "— Alberto",
    signRole: "संस्थापक, Vectorial Data",
    reply: "प्रश्न? इस ईमेल का सीधे जवाब दें। मैं हर एक पढ़ता हूँ।",
    footerLegal: "यह निवेश सलाह नहीं है। सभी कीमतें USD में हैं।",
  },
};

export async function sendWelcomeEmail(
  email: string,
  magicLinkUrl: string,
  waGroupLink: string | null,
  deliveryChannel: DeliveryChannel,
  locale: string = "es"
): Promise<void> {
  const l = locale in WELCOME_COPY ? locale : "es";
  const c = WELCOME_COPY[l];

  const channelText =
    deliveryChannel === "whatsapp"
      ? c.channelWhatsApp
      : deliveryChannel === "email"
        ? c.channelEmail
        : c.channelBoth;

  const showWaBlock =
    (deliveryChannel === "whatsapp" || deliveryChannel === "both") &&
    Boolean(waGroupLink);

  const waBlockHtml = showWaBlock
    ? `
  <tr><td style="padding:0 32px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;">
      <tr><td style="padding:20px 20px 16px;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#065f46;">${c.waCtaTitle}</p>
        <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#047857;">${c.waCtaDesc}</p>
        <table cellpadding="0" cellspacing="0"><tr><td>
          <a href="${waGroupLink}" style="display:inline-block;background:#25D366;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;">
            💬 ${c.waButton}
          </a>
        </td></tr></table>
      </td></tr>
    </table>
  </td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;font-size:1px;color:#f9fafb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${c.intro}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
  <!-- Header -->
  <tr><td style="padding:32px 32px 8px;text-align:center;">
    <img src="${SITE}/logo.png" width="40" height="40" alt="Vectorial Data" style="display:inline-block;margin-bottom:12px;" />
  </td></tr>
  <!-- Heading -->
  <tr><td style="padding:8px 32px 8px;">
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">${c.heading}</h1>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;">${c.intro}</p>
  </td></tr>
  <!-- Channel badge -->
  <tr><td style="padding:16px 32px 8px;">
    <p style="margin:0;font-size:13px;color:#6b7280;">
      ${c.channelLabel}: <strong style="color:#111827;">${channelText}</strong>
    </p>
  </td></tr>
  ${waBlockHtml}
  <!-- What to expect -->
  <tr><td style="padding:${showWaBlock ? "0" : "16px"} 32px 8px;">
    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">${c.expectTitle}</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 0 8px;font-size:14px;line-height:1.6;color:#374151;">
        <span style="color:#4f46e5;font-weight:600;">→</span> ${c.expectTiming}
      </td></tr>
      <tr><td style="padding:0 0 8px;font-size:14px;line-height:1.6;color:#374151;">
        <span style="color:#4f46e5;font-weight:600;">→</span> ${c.expectFrequency}
      </td></tr>
      <tr><td style="padding:0 0 12px;font-size:14px;line-height:1.6;color:#374151;">
        <span style="color:#4f46e5;font-weight:600;">→</span> ${c.expectFormat}
      </td></tr>
      <tr><td style="padding:12px 0 0;border-top:1px solid #f3f4f6;font-size:14px;line-height:1.6;color:#111827;font-style:italic;">
        ${c.expectAha}
      </td></tr>
    </table>
  </td></tr>
  <!-- DCA rule tip (text-only; preserves WA block as only button) -->
  <tr><td style="padding:20px 32px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-left:3px solid #4f46e5;border-radius:6px;">
      <tr><td style="padding:16px 18px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#4338ca;text-transform:uppercase;letter-spacing:0.4px;">${c.ruleTipTitle}</p>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#374151;">${c.ruleTipBody}</p>
        <p style="margin:0;font-size:14px;">
          <a href="${SITE}/metodo" style="color:#4f46e5;text-decoration:none;font-weight:600;">${c.ruleTipLink}</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
  <!-- Magic link (demoted to text link so WA block is the only button) -->
  <tr><td style="padding:20px 32px 8px;">
    <p style="margin:0 0 4px;font-size:14px;color:#374151;">
      <strong style="color:#111827;">${c.webTitle}.</strong> ${c.webDesc}
    </p>
    <p style="margin:6px 0 0;font-size:14px;">
      <a href="${magicLinkUrl}" style="color:#4f46e5;text-decoration:none;font-weight:600;">${c.webLink}</a>
      <span style="color:#9ca3af;font-size:12px;margin-left:8px;">${c.webExpiry}</span>
    </p>
  </td></tr>
  <!-- Personal sign-off -->
  <tr><td style="padding:24px 32px 8px;">
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#374151;font-style:italic;">${c.reply}</p>
    <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${c.sign}</p>
    <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${c.signRole}</p>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;text-align:center;margin-top:16px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">${c.footerLegal}</p>
    <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">
      <a href="${SITE}" style="color:#4f46e5;text-decoration:none;">vectorialdata.com</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    replyTo: "Hello@vectorialdata.com",
    to: email,
    subject: c.subject,
    html,
  });

  if (error) throw new Error(`Failed to send welcome email: ${error.message}`);
}

// ── Admin Alerts (real-time subscription events) ─────────────
// Alberto wants to know the moment someone subscribes, cancels, or
// fails to pay — and which delivery channel they picked.

interface NewSubscriberData {
  email: string;
  deliveryChannel: DeliveryChannel;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  amountCents?: number | null;
  currency?: string | null;
  country?: string | null;
  locale?: string;
}

function formatAmount(cents: number | null | undefined, currency: string | null | undefined): string {
  if (cents == null || currency == null) return "—";
  const amount = (cents / 100).toFixed(2);
  return `${amount} ${currency.toUpperCase()}`;
}

export async function sendNewSubscriberAlertToAdmin(
  adminEmail: string,
  data: NewSubscriberData
): Promise<void> {
  const channelEmoji =
    data.deliveryChannel === "whatsapp"
      ? "💬 WhatsApp"
      : data.deliveryChannel === "email"
        ? "✉️ Email"
        : "💬✉️ WhatsApp + Email";

  const timestamp = new Date().toISOString();
  const stripeUrl = `https://dashboard.stripe.com/customers/${data.stripeCustomerId}`;

  const subject = `🎉 Nueva suscripción: ${data.email} [${data.deliveryChannel}]`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
  <tr><td style="padding:24px 28px;background:#ecfdf5;border-bottom:1px solid #a7f3d0;">
    <p style="margin:0;font-size:13px;color:#047857;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Nueva suscripción</p>
    <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#064e3b;">${escapeHtml(data.email)}</h1>
  </td></tr>
  <tr><td style="padding:24px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;width:140px;">Canal</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${channelEmoji}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Monto</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;">${formatAmount(data.amountCents, data.currency)}</td></tr>
      ${data.country ? `<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">País</td><td style="padding:8px 0;font-size:14px;color:#111827;">${escapeHtml(data.country)}</td></tr>` : ""}
      ${data.locale ? `<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Locale</td><td style="padding:8px 0;font-size:14px;color:#111827;">${escapeHtml(data.locale)}</td></tr>` : ""}
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Customer</td>
          <td style="padding:8px 0;font-size:12px;color:#6b7280;font-family:monospace;">${escapeHtml(data.stripeCustomerId)}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Subscription</td>
          <td style="padding:8px 0;font-size:12px;color:#6b7280;font-family:monospace;">${escapeHtml(data.stripeSubscriptionId)}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Timestamp</td>
          <td style="padding:8px 0;font-size:12px;color:#6b7280;font-family:monospace;">${timestamp}</td></tr>
    </table>
    <div style="margin-top:20px;">
      <a href="${stripeUrl}" style="display:inline-block;background:#635bff;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Ver en Stripe →</a>
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject,
    html,
  });

  if (error) throw new Error(`Failed to send new-subscriber admin alert: ${error.message}`);
}

interface ChurnAlertData {
  stripeCustomerId: string;
  email?: string | null;
  reason?: string | null;
}

export async function sendChurnAlertToAdmin(
  adminEmail: string,
  data: ChurnAlertData
): Promise<void> {
  const subject = `😔 Cancelación: ${data.email ?? data.stripeCustomerId}`;
  const stripeUrl = `https://dashboard.stripe.com/customers/${data.stripeCustomerId}`;
  const timestamp = new Date().toISOString();

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
  <tr><td style="padding:24px 28px;background:#fef2f2;border-bottom:1px solid #fecaca;">
    <p style="margin:0;font-size:13px;color:#991b1b;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Cancelación</p>
    <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#7f1d1d;">${escapeHtml(data.email ?? data.stripeCustomerId)}</h1>
  </td></tr>
  <tr><td style="padding:24px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${data.email ? `<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;width:140px;">Email</td><td style="padding:8px 0;font-size:14px;color:#111827;">${escapeHtml(data.email)}</td></tr>` : ""}
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;width:140px;">Customer</td>
          <td style="padding:8px 0;font-size:12px;color:#6b7280;font-family:monospace;">${escapeHtml(data.stripeCustomerId)}</td></tr>
      ${data.reason ? `<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Razón</td><td style="padding:8px 0;font-size:14px;color:#111827;">${escapeHtml(data.reason)}</td></tr>` : ""}
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Timestamp</td>
          <td style="padding:8px 0;font-size:12px;color:#6b7280;font-family:monospace;">${timestamp}</td></tr>
    </table>
    <div style="margin-top:20px;">
      <a href="${stripeUrl}" style="display:inline-block;background:#635bff;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Ver en Stripe →</a>
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject,
    html,
  });

  if (error) throw new Error(`Failed to send churn admin alert: ${error.message}`);
}

interface PaymentFailedAlertData {
  stripeCustomerId: string;
  email?: string | null;
  amountCents?: number | null;
  currency?: string | null;
}

export async function sendPaymentFailedAlertToAdmin(
  adminEmail: string,
  data: PaymentFailedAlertData
): Promise<void> {
  const subject = `⚠️ Pago fallido: ${data.email ?? data.stripeCustomerId}`;
  const stripeUrl = `https://dashboard.stripe.com/customers/${data.stripeCustomerId}`;
  const timestamp = new Date().toISOString();

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
  <tr><td style="padding:24px 28px;background:#fffbeb;border-bottom:1px solid #fcd34d;">
    <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Pago fallido</p>
    <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#78350f;">${escapeHtml(data.email ?? data.stripeCustomerId)}</h1>
  </td></tr>
  <tr><td style="padding:24px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${data.email ? `<tr><td style="padding:8px 0;font-size:14px;color:#6b7280;width:140px;">Email</td><td style="padding:8px 0;font-size:14px;color:#111827;">${escapeHtml(data.email)}</td></tr>` : ""}
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;width:140px;">Monto</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;">${formatAmount(data.amountCents, data.currency)}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Customer</td>
          <td style="padding:8px 0;font-size:12px;color:#6b7280;font-family:monospace;">${escapeHtml(data.stripeCustomerId)}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Timestamp</td>
          <td style="padding:8px 0;font-size:12px;color:#6b7280;font-family:monospace;">${timestamp}</td></tr>
    </table>
    <div style="margin-top:20px;">
      <a href="${stripeUrl}" style="display:inline-block;background:#635bff;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Ver en Stripe →</a>
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject,
    html,
  });

  if (error) throw new Error(`Failed to send payment-failed admin alert: ${error.message}`);
}

// ── WA Join Follow-up (Day 2-3 nudge) ────────────────────────
// Sent to subscribers who paid 48h+ ago, chose WhatsApp delivery,
// and never clicked the tracked WA join button. Empathetic tone —
// assume they had trouble, not that they forgot.

const WA_FOLLOWUP_COPY: Record<
  string,
  {
    subject: string;
    heading: string;
    body: string;
    stepsTitle: string;
    step1: string;
    step2: string;
    step3: string;
    button: string;
    help: string;
    sign: string;
    signRole: string;
  }
> = {
  es: {
    subject: "¿Tuviste problema uniéndote al grupo?",
    heading: "Notamos que no has entrado al grupo todavía.",
    body: "Sin acceso al grupo no estás recibiendo los picks — y eso es literalmente lo que pagaste. Si algo falló, aquí está el botón de nuevo con los pasos claros.",
    stepsTitle: "Cómo entrar en 30 segundos",
    step1: "Haz clic en el botón verde de abajo.",
    step2: "WhatsApp abrirá y pedirá confirmar que quieres unirte.",
    step3: "Apruebo tu solicitud en minutos — recibirás los picks directo.",
    button: "Unirme al grupo ahora",
    help: "¿Algo no funciona? Responde este email y lo resuelvo yo mismo.",
    sign: "— Alberto",
    signRole: "Fundador, Vectorial Data",
  },
  en: {
    subject: "Did you have trouble joining the group?",
    heading: "We noticed you haven't joined the group yet.",
    body: "Without access to the group you're not getting the picks — which is literally what you paid for. If something broke, here's the button again with clear steps.",
    stepsTitle: "How to join in 30 seconds",
    step1: "Click the green button below.",
    step2: "WhatsApp will open and ask you to confirm you want to join.",
    step3: "I approve your request in minutes — you'll start getting picks.",
    button: "Join the group now",
    help: "Something not working? Reply to this email and I'll fix it personally.",
    sign: "— Alberto",
    signRole: "Founder, Vectorial Data",
  },
  pt: {
    subject: "Teve problema para entrar no grupo?",
    heading: "Notamos que você ainda não entrou no grupo.",
    body: "Sem acesso ao grupo você não está recebendo os picks — e é literalmente pelo que pagou. Se algo falhou, aqui está o botão de novo com os passos claros.",
    stepsTitle: "Como entrar em 30 segundos",
    step1: "Clique no botão verde abaixo.",
    step2: "O WhatsApp abrirá e pedirá para confirmar que quer entrar.",
    step3: "Aprovo sua solicitação em minutos — receberá os picks direto.",
    button: "Entrar no grupo agora",
    help: "Algo não funciona? Responda este email e eu resolvo pessoalmente.",
    sign: "— Alberto",
    signRole: "Fundador, Vectorial Data",
  },
  hi: {
    subject: "क्या ग्रुप में शामिल होने में समस्या हुई?",
    heading: "हमने देखा कि आप अभी तक ग्रुप में शामिल नहीं हुए हैं।",
    body: "ग्रुप में पहुँच के बिना आपको picks नहीं मिल रहे — और वही आपने खरीदा है। अगर कुछ गलत हुआ, यहाँ फिर से बटन है साफ steps के साथ।",
    stepsTitle: "30 सेकंड में कैसे शामिल हों",
    step1: "नीचे हरे बटन पर क्लिक करें।",
    step2: "WhatsApp खुलेगा और शामिल होने की पुष्टि पूछेगा।",
    step3: "मैं आपकी request मिनटों में approve करता हूँ — picks मिलना शुरू।",
    button: "अभी ग्रुप में शामिल हों",
    help: "कुछ काम नहीं कर रहा? इस email का जवाब दें, मैं खुद solve करूँगा।",
    sign: "— Alberto",
    signRole: "संस्थापक, Vectorial Data",
  },
};

export async function sendWaJoinFollowupEmail(
  email: string,
  trackedWaUrl: string,
  locale: string = "es"
): Promise<void> {
  const l = locale in WA_FOLLOWUP_COPY ? locale : "es";
  const c = WA_FOLLOWUP_COPY[l];

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;font-size:1px;color:#f9fafb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${c.body}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
  <tr><td style="padding:32px 32px 8px;text-align:center;">
    <img src="${SITE}/logo.png" width="40" height="40" alt="Vectorial Data" style="display:inline-block;margin-bottom:12px;" />
  </td></tr>
  <tr><td style="padding:8px 32px 8px;">
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">${c.heading}</h1>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;">${c.body}</p>
  </td></tr>
  <tr><td style="padding:20px 32px 8px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#065f46;">${c.stepsTitle}</p>
        <p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#047857;"><strong>1.</strong> ${c.step1}</p>
        <p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#047857;"><strong>2.</strong> ${c.step2}</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#047857;"><strong>3.</strong> ${c.step3}</p>
        <table cellpadding="0" cellspacing="0"><tr><td>
          <a href="${trackedWaUrl}" style="display:inline-block;background:#25D366;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;">
            💬 ${c.button}
          </a>
        </td></tr></table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:24px 32px 8px;">
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#374151;font-style:italic;">${c.help}</p>
    <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${c.sign}</p>
    <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${c.signRole}</p>
  </td></tr>
  <tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      <a href="${SITE}" style="color:#4f46e5;text-decoration:none;">vectorialdata.com</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    replyTo: "Hello@vectorialdata.com",
    to: email,
    subject: c.subject,
    html,
  });

  if (error) throw new Error(`Failed to send wa-followup email: ${error.message}`);
}

// ── Budget Reminder (3-day follow-up if monthly_budget is NULL) ──────
// Sent once per subscriber, 3 days after signup, if they haven't set
// their DCA rule yet. Stamps budget_reminder_sent_at to prevent doubles.

const BUDGET_REMINDER_COPY: Record<
  string,
  {
    subject: string;
    heading: string;
    body: string;
    ruleTitle: string;
    rule1: string;
    rule2: string;
    rule3: string;
    button: string;
    why: string;
    sign: string;
    signRole: string;
  }
> = {
  es: {
    subject: "Tu regla de compra todavía no está lista",
    heading: "Un último paso para que el método funcione.",
    body: "Has recibido picks, pero aún no definiste cuánto invertir en cada uno. Sin esa regla, el método no hace su magia — y el método es por lo que estás aquí.",
    ruleTitle: "La regla, en 3 líneas",
    rule1: "Decide un presupuesto mensual que no te duela mantener un año.",
    rule2: "Divídelo entre 30. Esa es tu cantidad por cada pick.",
    rule3: "Siempre la misma cantidad. No pienses, no adivines.",
    button: "Definir mi regla en 30 segundos",
    why: "Los que se quedan 12 meses son los que tienen una regla. Los que adivinan se frustran y se van. Tú decides de qué lado estar.",
    sign: "— Alberto",
    signRole: "Fundador, Vectorial Data",
  },
  en: {
    subject: "Your buying rule isn't set yet",
    heading: "One last step for the method to work.",
    body: "You've been getting picks, but you haven't decided how much to invest in each one. Without that rule, the method doesn't do its magic — and the method is why you're here.",
    ruleTitle: "The rule, in 3 lines",
    rule1: "Pick a monthly budget you can sustain for a year without pain.",
    rule2: "Divide it by 30. That's your per-pick amount.",
    rule3: "Always the same amount. Don't think, don't guess.",
    button: "Set my rule in 30 seconds",
    why: "The people who stay for 12 months have a rule. The people who guess get frustrated and leave. You decide which side to be on.",
    sign: "— Alberto",
    signRole: "Founder, Vectorial Data",
  },
  pt: {
    subject: "Sua regra de compra ainda não está pronta",
    heading: "Um último passo para o método funcionar.",
    body: "Você recebeu picks, mas ainda não definiu quanto investir em cada um. Sem essa regra, o método não faz sua mágica — e o método é por isso que você está aqui.",
    ruleTitle: "A regra, em 3 linhas",
    rule1: "Escolha um orçamento mensal que você consiga manter um ano sem dor.",
    rule2: "Divida por 30. Essa é sua quantia por pick.",
    rule3: "Sempre a mesma quantia. Não pense, não adivinhe.",
    button: "Definir minha regra em 30 segundos",
    why: "Quem fica 12 meses tem uma regra. Quem adivinha se frustra e sai. Você decide de que lado estar.",
    sign: "— Alberto",
    signRole: "Fundador, Vectorial Data",
  },
  hi: {
    subject: "आपका खरीद नियम अभी तय नहीं है",
    heading: "method को काम करने के लिए आखिरी कदम।",
    body: "आपको picks मिल रहे हैं, लेकिन आपने अभी तय नहीं किया कि हर एक में कितना निवेश करना है। उस नियम के बिना, method अपना जादू नहीं करता — और method ही वो कारण है जिसलिए आप यहाँ हैं।",
    ruleTitle: "नियम, 3 पंक्तियों में",
    rule1: "एक मासिक बजट चुनें जिसे आप एक साल बिना तकलीफ के बनाए रख सकें।",
    rule2: "30 से विभाजित करें। यही आपकी प्रति-pick राशि है।",
    rule3: "हमेशा वही राशि। मत सोचें, मत अनुमान लगाएं।",
    button: "30 सेकंड में मेरा नियम सेट करें",
    why: "जो 12 महीने रुकते हैं उनके पास एक नियम होता है। जो अनुमान लगाते हैं वे निराश होकर चले जाते हैं। आप तय करें किस तरफ होना है।",
    sign: "— Alberto",
    signRole: "संस्थापक, Vectorial Data",
  },
};

export async function sendBudgetReminderEmail(
  email: string,
  ctaUrl: string,
  locale: string = "es"
): Promise<void> {
  const l = locale in BUDGET_REMINDER_COPY ? locale : "es";
  const c = BUDGET_REMINDER_COPY[l];

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;font-size:1px;color:#f9fafb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${c.body}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
  <tr><td style="padding:32px 32px 8px;text-align:center;">
    <img src="${SITE}/logo.png" width="40" height="40" alt="Vectorial Data" style="display:inline-block;margin-bottom:12px;" />
  </td></tr>
  <tr><td style="padding:8px 32px 8px;">
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">${c.heading}</h1>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;">${c.body}</p>
  </td></tr>
  <tr><td style="padding:20px 32px 8px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#4338ca;">${c.ruleTitle}</p>
        <p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#374151;"><strong>1.</strong> ${c.rule1}</p>
        <p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#374151;"><strong>2.</strong> ${c.rule2}</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#374151;"><strong>3.</strong> ${c.rule3}</p>
        <table cellpadding="0" cellspacing="0"><tr><td>
          <a href="${ctaUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;">
            ${c.button}
          </a>
        </td></tr></table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:24px 32px 8px;">
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#374151;font-style:italic;">${c.why}</p>
    <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${c.sign}</p>
    <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${c.signRole}</p>
  </td></tr>
  <tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      <a href="${SITE}" style="color:#4f46e5;text-decoration:none;">vectorialdata.com</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    replyTo: "Hello@vectorialdata.com",
    to: email,
    subject: c.subject,
    html,
  });

  if (error) throw new Error(`Failed to send budget-reminder email: ${error.message}`);
}
