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

const EVENT_ICONS: Record<string, string> = {
  price_move: "📈",
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
    priceMoves: "Movimientos fuertes",
    dividends: "Dividendos",
    earnings: "Earnings proximos",
    analysts: "Opinion de analistas",
    analystSummary: "{up} de nuestras empresas tienen consenso de compra",
    viewAll: "Ver noticias + explicaciones AI",
    footer: "Esto no es consejo de inversion.",
    freeTitle: "Que paso con nuestras acciones",
    freeCta: "Entiende TODO por $1/mes",
    freeMore: "eventos mas esta semana",
    meaningLabel: "Que significa",
    actionLabel: "Para nuestro portafolio",
    up: "subio",
    down: "bajo",
    exDiv: "ex-dividendo",
    yield: "rendimiento",
    reportsOn: "reporta resultados el",
    inDays: "en {days} dias",
    analystUp: "recomiendan comprar",
    analystDown: "recomiendan comprar",
    near52High: "cerca de maximo 52 semanas",
    near52Low: "cerca de minimo 52 semanas",
  },
  en: {
    title: "Weekly Summary",
    portfolioLabel: "Our portfolio this week",
    best: "Best",
    worst: "Worst",
    priceMoves: "Big moves",
    dividends: "Dividends",
    earnings: "Upcoming earnings",
    analysts: "Analyst opinions",
    analystSummary: "{up} of our companies have a Buy consensus",
    viewAll: "View news + AI explanations",
    footer: "This is not investment advice.",
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
    portfolioLabel: "Nosso portfolio esta semana",
    best: "Melhor",
    worst: "Pior",
    priceMoves: "Movimentos fortes",
    dividends: "Dividendos",
    earnings: "Resultados proximos",
    analysts: "Opiniao dos analistas",
    analystSummary: "{up} das nossas empresas tem consenso de compra",
    viewAll: "Ver noticias + explicacoes AI",
    footer: "Isto nao e conselho de investimento.",
    freeTitle: "O que aconteceu com nossas acoes",
    freeCta: "Entenda TUDO por $1/mes",
    freeMore: "eventos a mais esta semana",
    meaningLabel: "O que significa",
    actionLabel: "Para nosso portfolio",
    up: "subiu",
    down: "caiu",
    exDiv: "ex-dividendo",
    yield: "rendimento",
    reportsOn: "reporta resultados em",
    inDays: "em {days} dias",
    analystUp: "recomendam compra",
    analystDown: "recomendam compra",
    near52High: "perto da maxima de 52 semanas",
    near52Low: "perto da minima de 52 semanas",
  },
  hi: {
    title: "साप्ताहिक सारांश",
    portfolioLabel: "इस सप्ताह हमारा पोर्टफोलियो",
    best: "सर्वश्रेष्ठ",
    worst: "सबसे खराब",
    priceMoves: "बड़े बदलाव",
    dividends: "लाभांश",
    earnings: "आगामी कमाई",
    analysts: "विश्लेषक राय",
    analystSummary: "{up} कंपनियों में खरीदने की सहमति है",
    viewAll: "समाचार + AI विश्लेषण देखें",
    footer: "यह निवेश सलाह नहीं है।",
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
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}

function renderDigestLine(e: PortfolioEvent, locale: string): string {
  const lang = L[locale] ? locale : "en";
  const tk = e.title_key;
  const p = e.params;

  if (tk.includes("priceUp"))
    return `<a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a> ${t(lang, "up")} ${p.pct}%`;
  if (tk.includes("priceDown"))
    return `<a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a> ${t(lang, "down")} ${p.pct}%`;
  if (tk.includes("dividendExDate"))
    return `<a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a> — ${t(lang, "exDiv")} ${p.date} (${p.yield}% ${t(lang, "yield")})`;
  if (tk.includes("dividendPaid"))
    return `<a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a> — ${p.amount}`;
  if (tk.includes("earningsUpcoming"))
    return `<a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a> — ${t(lang, "reportsOn")} ${p.date}`;
  if (tk.includes("ConsensusUp"))
    return `<a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a> — ${p.buyPct}% ${t(lang, "analystUp")} (${p.analysts} ${parseInt(p.analysts) === 1 ? "analista" : "analistas"})`;
  if (tk.includes("ConsensusDown"))
    return `<a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a> — ${p.buyPct}% ${t(lang, "analystDown")} (${p.analysts} ${parseInt(p.analysts) === 1 ? "analista" : "analistas"})`;
  if (tk.includes("near52High"))
    return `<a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a> — ${t(lang, "near52High")} (${p.pct}%)`;
  if (tk.includes("near52Low"))
    return `<a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a> — ${t(lang, "near52Low")} (${p.pct}%)`;
  if (tk.includes("newsAlert"))
    return `<a href="${SITE}/stocks/${p.ticker}" style="color:#111827;text-decoration:none;"><strong>${p.ticker}</strong></a> — ${p.headline}`;

  // Fallback: use old renderEventText logic
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
      const icon = EVENT_ICONS[e.event_type] ?? "📌";
      const line = renderDigestLine(e, locale);
      return `<tr><td style="padding:6px 0;font-size:14px;line-height:1.4;">${icon} ${line}</td></tr>`;
    })
    .join("");

  const moreText =
    events.length > limit
      ? `<tr><td style="padding:4px 0;font-size:12px;color:#9ca3af;">+${events.length - limit} mas</td></tr>`
      : "";

  return `
    <div style="margin-top:20px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${title}</p>
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
  if (best && worst && best.params.ticker !== worst.params.ticker) {
    const bestPct = best.params.pct;
    const worstPct = worst.params.pct;
    const bestDir = best.title_key.includes("Up") ? "+" : "-";
    const worstDir = worst.title_key.includes("Up") ? "+" : "-";
    details = `<span style="color:#6b7280;font-size:13px;">${t(lang, "best")}: <strong>${best.params.ticker}</strong> ${bestDir}${bestPct}% · ${t(lang, "worst")}: <strong>${worst.params.ticker}</strong> ${worstDir}${worstPct}%</span>`;
  }

  return `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;margin-bottom:8px;">
      <p style="margin:0;font-size:13px;color:#374151;font-weight:500;">${t(lang, "portfolioLabel")}</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:${color};letter-spacing:-0.5px;">${sign}${pct.toFixed(2)}%</p>
      ${details ? `<p style="margin:6px 0 0;">${details}</p>` : ""}
    </div>`;
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
      es: `y ${rest} noticias mas`,
      en: `and ${rest} more updates`,
      pt: `e ${rest} noticias mais`,
      hi: `और ${rest} अपडेट`,
    };
    const lang = moreText[locale] ? locale : "en";
    return `${top.params.ticker} ${arrow}${top.params.pct}% ${moreText[lang]} — Vectorial Data`;
  }
  const fallback: Record<string, string> = {
    es: `${events.length} noticias de nuestro portafolio — Vectorial Data`,
    en: `${events.length} updates from our portfolio — Vectorial Data`,
    pt: `${events.length} noticias do nosso portfolio — Vectorial Data`,
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

  // Analysts: show top 3 most extreme (highest or lowest buyPct)
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

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
    <div style="background:#4f46e5;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">${t(lang, "title")}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Vectorial Data</p>
    </div>
    <div style="padding:16px 24px;">
      ${summaryHtml}
      ${priceSection}
      ${divSection}
      ${earnSection}
      ${analystSection}
      ${newsSection}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e4e4e7;text-align:center;">
      <a href="${SITE}/notifications" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">${t(lang, "viewAll")}</a>
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

  const summaryHtml = buildSummaryHtml(locale, summary, best, worst);

  // Show 1 featured event with AI explanation
  const featured = events[0];
  const featIcon = EVENT_ICONS[featured.event_type] ?? "📌";
  const featLine = renderDigestLine(featured, locale);
  const explanation =
    featured.explanations?.[locale as "en" | "es" | "pt" | "hi"] ??
    featured.explanations?.["en"];

  let explanationHtml = "";
  if (explanation) {
    explanationHtml = `
      <div style="background:#f0f0ff;border-radius:8px;padding:12px 16px;margin-top:10px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#4f46e5;text-transform:uppercase;">${t(lang, "meaningLabel")}</p>
        <p style="margin:0 0 10px;font-size:13px;color:#374151;line-height:1.5;">${explanation.meaning}</p>
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#4f46e5;text-transform:uppercase;">${t(lang, "actionLabel")}</p>
        <p style="margin:0;font-size:13px;color:#374151;line-height:1.5;">${explanation.action}</p>
      </div>`;
  }

  // Muted preview of 4 more events
  const preview = events.slice(1, 5);
  const previewRows = preview
    .map((e) => {
      const icon = EVENT_ICONS[e.event_type] ?? "📌";
      return `<tr><td style="padding:4px 0;font-size:13px;color:#9ca3af;">${icon} ${renderDigestLine(e, locale)}</td></tr>`;
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
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
    <div style="background:#4f46e5;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">${t(lang, "freeTitle")}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Vectorial Data</p>
    </div>
    <div style="padding:16px 24px;">
      ${summaryHtml}
      <p style="margin:16px 0 4px;font-size:15px;font-weight:600;color:#111827;">${featIcon} ${featLine}</p>
      ${explanationHtml}
      ${preview.length > 0 ? `
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e4e4e7;">
        <table style="width:100%;border-collapse:collapse;">${previewRows}${moreRow}</table>
      </div>` : ""}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e4e4e7;text-align:center;">
      <a href="${SITE}/join" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">${t(lang, "freeCta")}</a>
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
  // Show the actual premium digest as preview
  const digestPreview = buildDigestHtml(events, "es", summary);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#f59e0b;border-radius:12px 12px 0 0;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">PREVIEW — Digest ${weekKey}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Esperando tu aprobacion para enviar</p>
    </div>
    <div style="background:#fff;padding:16px 24px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
      <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
        <p style="margin:0;font-size:13px;color:#92400e;font-weight:500;">${events.length} eventos | ${recipientCount} destinatarios (${premiumCount} premium, ${freeCount} free)</p>
      </div>
      <p style="margin:0 0 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;">Asi se vera el digest premium:</p>
    </div>
    <div style="border:2px dashed #d4d4d8;border-radius:8px;margin:0 0 16px;overflow:hidden;">
      ${digestPreview}
    </div>
    <div style="text-align:center;padding:16px;">
      <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">Aprobar y Enviar</a>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Si no apruebas, no se envia nada.</p>
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
