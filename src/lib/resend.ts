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
    topPages: { path: string; views: number }[];
    topCountries: { country: string; users: number }[];
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
    const countryRows = g.topCountries.slice(0, 5).map(c =>
      `<tr><td style="padding:3px 0;font-size:12px;color:#374151;">${c.country}</td><td style="padding:3px 0;font-size:12px;text-align:right;">${c.users}</td></tr>`
    ).join("");
    ga4Section = `
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f4f4f5;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">WEBSITE TRAFFIC (GA4)</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:3px 0;font-size:13px;">Page views</td><td style="text-align:right;font-weight:600;font-size:13px;">${g.pageViews.toLocaleString()}</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">Sessions</td><td style="text-align:right;font-size:13px;">${g.sessions.toLocaleString()}</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;">Users</td><td style="text-align:right;font-size:13px;">${g.users.toLocaleString()}</td></tr>
      </table>
      ${pageRows ? `<p style="margin:12px 0 4px;font-size:11px;color:#9ca3af;font-weight:600;">TOP PAGES</p><table style="width:100%;border-collapse:collapse;">${pageRows}</table>` : ""}
      ${countryRows ? `<p style="margin:12px 0 4px;font-size:11px;color:#9ca3af;font-weight:600;">TOP COUNTRIES</p><table style="width:100%;border-collapse:collapse;">${countryRows}</table>` : ""}
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
