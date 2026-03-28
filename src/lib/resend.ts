import { Resend } from "resend";
import type { PortfolioEvent } from "@/lib/types";

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
    portfolioLabel: "Nuestro portafolio esta semana",
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
    exDiv: "ex-dividendo",
    yield: "rendimiento",
    reportsOn: "reporta resultados el",
    inDays: "en {days} días",
    analystUp: "recomiendan comprar",
    analystDown: "recomiendan comprar",
    near52High: "cerca de máximo 52 semanas",
    near52Low: "cerca de mínimo 52 semanas",
  },
  en: {
    title: "Weekly Summary",
    portfolioLabel: "Our portfolio this week",
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
    exDiv: "ex-dividend",
    yield: "yield",
    reportsOn: "reports earnings on",
    inDays: "in {days} days",
    analystUp: "rate Buy",
    analystDown: "rate Buy",
    near52High: "near 52-week high",
    near52Low: "near 52-week low",
  },
  pt: {
    title: "Resumo Semanal",
    portfolioLabel: "Nosso portfólio esta semana",
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
    exDiv: "ex-dividendo",
    yield: "rendimento",
    reportsOn: "reporta resultados em",
    inDays: "em {days} dias",
    analystUp: "recomendam compra",
    analystDown: "recomendam compra",
    near52High: "perto da máxima de 52 semanas",
    near52Low: "perto da mínima de 52 semanas",
  },
  hi: {
    title: "साप्ताहिक सारांश",
    portfolioLabel: "इस सप्ताह हमारा पोर्टफोलियो",
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
    exDiv: "एक्स-डिविडेंड",
    yield: "यील्ड",
    reportsOn: "कमाई रिपोर्ट करेगा",
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
  const sorted = [...priceMoves].sort(
    (a, b) => getSignedPct(b) - getSignedPct(a)
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  // Show best/worst even if same ticker (single move), just show both if different
  return { best, worst: worst === best ? null : worst };
}

// Price moves use colored arrows instead of emoji
function renderPriceMoveLine(e: PortfolioEvent, locale: string): string {
  const lang = L[locale] ? locale : "en";
  const p = e.params;
  const isUp = e.title_key.includes("Up");
  const color = isUp ? "#16a34a" : "#dc2626";
  const arrow = isUp ? "&#9650;" : "&#9660;";
  const verb = isUp ? t(lang, "up") : t(lang, "down");

  if (e.title_key.includes("near52High") || e.title_key.includes("near52Low")) {
    const label = e.title_key.includes("High")
      ? t(lang, "near52High")
      : t(lang, "near52Low");
    return `<span style="color:${color};font-weight:700;">${arrow}</span> <a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a> — ${label} (${p.pct}%)`;
  }

  return `<span style="color:${color};font-weight:700;">${arrow}</span> <a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a> ${verb} <span style="color:${color};font-weight:600;">${p.pct}%</span>`;
}

function renderDigestLine(e: PortfolioEvent, locale: string): string {
  const lang = L[locale] ? locale : "en";
  const p = e.params;

  // Price moves handled separately with colors
  if (e.event_type === "price_move") return renderPriceMoveLine(e, locale);

  const tickerLink = `<a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a>`;

  if (e.title_key.includes("dividendExDate"))
    return `${tickerLink} — ${t(lang, "exDiv")} ${p.date} (${p.yield}% ${t(lang, "yield")})`;
  if (e.title_key.includes("dividendPaid"))
    return `${tickerLink} — ${p.amount}`;
  if (e.title_key.includes("earningsUpcoming"))
    return `${tickerLink} — ${t(lang, "reportsOn")} ${p.date}`;
  if (e.title_key.includes("ConsensusUp") || e.title_key.includes("ConsensusDown"))
    return `${tickerLink} — ${p.buyPct}% ${t(lang, "analystUp")} (${parseInt(p.analysts) === 1 ? "1 analista" : `${p.analysts} analistas`})`;
  if (e.title_key.includes("newsAlert"))
    return `${tickerLink} — ${p.headline}`;

  return `<strong>${p.ticker || ""}</strong>`;
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

  if (!summary?.weeklyChangePct && summary?.weeklyChangePct !== 0)
    return "";

  const pct = summary.weeklyChangePct;
  const sign = pct >= 0 ? "+" : "";
  const color = pct >= 0 ? "#16a34a" : "#dc2626";

  let details = "";
  if (best) {
    const bestPct = best.params.pct;
    const bestDir = best.title_key.includes("Up") ? "+" : "-";
    let detailParts = `${t(lang, "best")}: <strong>${best.params.ticker}</strong> ${bestDir}${bestPct}%`;
    if (worst) {
      const worstPct = worst.params.pct;
      const worstDir = worst.title_key.includes("Up") ? "+" : "-";
      detailParts += ` · ${t(lang, "worst")}: <strong>${worst.params.ticker}</strong> ${worstDir}${worstPct}%`;
    }
    details = `<p style="margin:6px 0 0;font-size:13px;color:#6b7280;">${detailParts}</p>`;
  }

  return `
    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;margin-bottom:8px;">
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

  const parts: string[] = [];

  // Portfolio direction
  if (summary?.weeklyChangePct != null) {
    parts.push(
      summary.weeklyChangePct >= 0
        ? (lang === "es" ? "semana positiva" : lang === "pt" ? "semana positiva" : lang === "hi" ? "अच्छा सप्ताह" : "positive week")
        : (lang === "es" ? "semana difícil" : lang === "pt" ? "semana difícil" : lang === "hi" ? "कठिन सप्ताह" : "tough week")
    );
  }

  // Dividends coming
  if (grouped.dividends.length > 0) {
    const divCount = grouped.dividends.length;
    parts.push(
      lang === "es" ? `${divCount} dividendo${divCount > 1 ? "s" : ""} en camino`
        : lang === "pt" ? `${divCount} dividendo${divCount > 1 ? "s" : ""} a caminho`
        : lang === "hi" ? `${divCount} लाभांश आ रहा है`
        : `${divCount} dividend${divCount > 1 ? "s" : ""} coming`
    );
  }

  // Notable move
  if (best && worst) {
    parts.push(
      lang === "es" ? `ojo con ${best.params.ticker} y ${worst.params.ticker}`
        : lang === "pt" ? `fique de olho em ${best.params.ticker} e ${worst.params.ticker}`
        : lang === "hi" ? `${best.params.ticker} और ${worst.params.ticker} पर नज़र रखें`
        : `watch ${best.params.ticker} and ${worst.params.ticker}`
    );
  }

  if (parts.length === 0) return "";

  const sentence = parts[0].charAt(0).toUpperCase() + parts[0].slice(1) +
    (parts.length > 1 ? ", " + parts.slice(1).join(", y ") : "") + ".";

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
    return `${top.params.ticker} ${arrow}${top.params.pct}% ${moreText[lang]} — Vectorial Data`;
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

  const preview = summary?.weeklyChangePct != null
    ? `${summary.weeklyChangePct >= 0 ? "+" : ""}${summary.weeklyChangePct.toFixed(2)}% esta semana. ${grouped.priceMoves.length} movimientos, ${grouped.dividends.length} dividendos, ${grouped.earnings.length} earnings.`
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

  const preview = summary?.weeklyChangePct != null
    ? `${summary.weeklyChangePct >= 0 ? "+" : ""}${summary.weeklyChangePct.toFixed(2)}% esta semana. Abre para ver qué pasó.`
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
