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

const EVENT_ICONS: Record<string, string> = {
  price_move: "📈",
  dividend: "💰",
  earnings: "📊",
  analyst: "⭐",
  news: "📰",
};

function renderEventText(event: PortfolioEvent, locale: string): string {
  // Map of i18n keys to simple template strings per locale
  const templates: Record<string, Record<string, string>> = {
    en: {
      "notifications.priceUp": "{ticker} rose {pct}% today",
      "notifications.priceDown": "{ticker} fell {pct}% today",
      "notifications.dividendPaid": "{ticker} paid a dividend of {amount}",
      "notifications.earningsReport": "{ticker} reported earnings: {summary}",
      "notifications.analystUpgrade": "{ticker} upgraded to {rating} by {analyst}",
      "notifications.analystDowngrade": "{ticker} downgraded to {rating} by {analyst}",
      "notifications.earningsUpcoming": "{ticker} reports earnings on {date} (in {days} days)",
      "notifications.dividendExDate": "{ticker} goes ex-dividend on {date} ({yield}% yield)",
      "notifications.analystConsensusUp": "Analysts upgraded {ticker} — {buyPct}% now rate Buy ({analysts} analysts)",
      "notifications.analystConsensusDown": "Analysts downgraded {ticker} — only {buyPct}% rate Buy ({analysts} analysts)",
      "notifications.near52High": "{ticker} is just {pct}% from its 52-week high of ${high}",
      "notifications.near52Low": "{ticker} is only {pct}% above its 52-week low of ${low}",
      "notifications.newsAlert": "{ticker}: {headline}",
    },
    es: {
      "notifications.priceUp": "{ticker} subió {pct}% hoy",
      "notifications.priceDown": "{ticker} bajó {pct}% hoy",
      "notifications.dividendPaid": "{ticker} pagó un dividendo de {amount}",
      "notifications.earningsReport": "{ticker} reportó ganancias: {summary}",
      "notifications.analystUpgrade": "{ticker} fue mejorado a {rating} por {analyst}",
      "notifications.analystDowngrade": "{ticker} fue degradado a {rating} por {analyst}",
      "notifications.earningsUpcoming": "{ticker} reporta resultados el {date} (en {days} días)",
      "notifications.dividendExDate": "{ticker} pasa a ex-dividendo el {date} ({yield}% de rendimiento)",
      "notifications.analystConsensusUp": "Analistas mejoraron {ticker} — {buyPct}% ahora lo recomiendan comprar ({analysts} analistas)",
      "notifications.analystConsensusDown": "Analistas bajaron {ticker} — solo {buyPct}% lo recomiendan comprar ({analysts} analistas)",
      "notifications.near52High": "{ticker} está a solo {pct}% de su máximo de 52 semanas (${high})",
      "notifications.near52Low": "{ticker} está solo {pct}% arriba de su mínimo de 52 semanas (${low})",
      "notifications.newsAlert": "{ticker}: {headline}",
    },
    pt: {
      "notifications.priceUp": "{ticker} subiu {pct}% hoje",
      "notifications.priceDown": "{ticker} caiu {pct}% hoje",
      "notifications.dividendPaid": "{ticker} pagou um dividendo de {amount}",
      "notifications.earningsReport": "{ticker} reportou resultados: {summary}",
      "notifications.analystUpgrade": "{ticker} foi elevado para {rating} por {analyst}",
      "notifications.analystDowngrade": "{ticker} foi rebaixado para {rating} por {analyst}",
      "notifications.earningsUpcoming": "{ticker} reporta resultados em {date} (em {days} dias)",
      "notifications.dividendExDate": "{ticker} fica ex-dividendo em {date} ({yield}% de rendimento)",
      "notifications.analystConsensusUp": "Analistas melhoraram {ticker} — {buyPct}% agora recomendam compra ({analysts} analistas)",
      "notifications.analystConsensusDown": "Analistas rebaixaram {ticker} — apenas {buyPct}% recomendam compra ({analysts} analistas)",
      "notifications.near52High": "{ticker} está a apenas {pct}% da máxima de 52 semanas (${high})",
      "notifications.near52Low": "{ticker} está apenas {pct}% acima da mínima de 52 semanas (${low})",
      "notifications.newsAlert": "{ticker}: {headline}",
    },
    hi: {
      "notifications.priceUp": "{ticker} आज {pct}% बढ़ा",
      "notifications.priceDown": "{ticker} आज {pct}% गिरा",
      "notifications.dividendPaid": "{ticker} ने {amount} का लाभांश दिया",
      "notifications.earningsReport": "{ticker} ने कमाई रिपोर्ट की: {summary}",
      "notifications.analystUpgrade": "{analyst} ने {ticker} को {rating} में अपग्रेड किया",
      "notifications.analystDowngrade": "{analyst} ने {ticker} को {rating} में डाउनग्रेड किया",
      "notifications.earningsUpcoming": "{ticker} {date} को कमाई रिपोर्ट करेगा ({days} दिन में)",
      "notifications.dividendExDate": "{ticker} {date} को एक्स-डिविडेंड होगा ({yield}% यील्ड)",
      "notifications.analystConsensusUp": "विश्लेषकों ने {ticker} को अपग्रेड किया — {buyPct}% अब खरीदने की सलाह देते हैं ({analysts} विश्लेषक)",
      "notifications.analystConsensusDown": "विश्लेषकों ने {ticker} को डाउनग्रेड किया — केवल {buyPct}% खरीदने की सलाह देते हैं ({analysts} विश्लेषक)",
      "notifications.near52High": "{ticker} अपने 52-सप्ताह के उच्चतम (${high}) से सिर्फ {pct}% दूर है",
      "notifications.near52Low": "{ticker} अपने 52-सप्ताह के न्यूनतम (${low}) से सिर्फ {pct}% ऊपर है",
      "notifications.newsAlert": "{ticker}: {headline}",
    },
  };

  const lang = templates[locale] ? locale : "en";
  let text = templates[lang][event.title_key] ?? templates.en[event.title_key] ?? event.title_key;

  for (const [key, val] of Object.entries(event.params)) {
    text = text.replace(`{${key}}`, val);
  }

  return text;
}

function buildDigestHtml(events: PortfolioEvent[], locale: string): string {
  const subjectLines: Record<string, string> = {
    en: "Your portfolio this week",
    es: "Tu portafolio esta semana",
    pt: "Seu portfólio esta semana",
    hi: "इस सप्ताह आपका पोर्टफोलियो",
  };

  const lang = subjectLines[locale] ? locale : "en";
  const title = subjectLines[lang];

  const rows = events
    .map((e) => {
      const icon = EVENT_ICONS[e.event_type] ?? "📌";
      const text = renderEventText(e, locale);
      const date = new Date(e.created_at).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      });
      return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:14px;">${icon} ${text}</td><td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:12px;color:#71717a;white-space:nowrap;">${date}</td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
    <div style="background:#4f46e5;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">${title}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Vectorial Data</p>
    </div>
    <div style="padding:16px 24px;">
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e4e4e7;text-align:center;">
      <a href="https://www.vectorialdata.com/notifications" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">View all notifications</a>
    </div>
    <div style="padding:12px 24px;text-align:center;font-size:11px;color:#a1a1aa;">
      <p style="margin:0;">Vectorial Data — Stock Portfolio</p>
      <p style="margin:4px 0 0;">This is not financial advice.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildFreeDigestHtml(events: PortfolioEvent[], locale: string): string {
  const titles: Record<string, string> = {
    en: "What happened with your stocks",
    es: "Qué pasó con tus acciones",
    pt: "O que aconteceu com suas ações",
    hi: "आपके स्टॉक्स में क्या हुआ",
  };

  const ctaLabels: Record<string, string> = {
    en: "Understand all news for $1/mo",
    es: "Entiende todas las noticias por $1/mes",
    pt: "Entenda todas as notícias por $1/mês",
    hi: "सभी समाचार समझें $1/माह में",
  };

  const moreLabels: Record<string, string> = {
    en: "more events this week",
    es: "eventos más esta semana",
    pt: "eventos a mais esta semana",
    hi: "और इवेंट इस सप्ताह",
  };

  const lang = titles[locale] ? locale : "en";
  const title = titles[lang];
  const ctaLabel = ctaLabels[lang];
  const moreLabel = moreLabels[lang];

  // Latest event gets full explanation
  const latest = events[0];
  const icon = EVENT_ICONS[latest.event_type] ?? "📌";
  const headline = renderEventText(latest, locale);
  const explanation = latest.explanations?.[locale as "en" | "es" | "pt" | "hi"] ?? latest.explanations?.["en"];

  let explanationHtml = "";
  if (explanation) {
    const meaningLabels: Record<string, string> = { en: "What it means", es: "Qué significa", pt: "O que significa", hi: "इसका मतलब" };
    const actionLabels: Record<string, string> = { en: "For your portfolio", es: "Para tu portafolio", pt: "Para seu portfólio", hi: "आपके पोर्टफोलियो के लिए" };
    explanationHtml = `
      <div style="background:#f0f0ff;border-radius:8px;padding:12px 16px;margin-top:12px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#4f46e5;text-transform:uppercase;">${meaningLabels[lang]}</p>
        <p style="margin:0 0 10px;font-size:13px;color:#374151;line-height:1.5;">${explanation.meaning}</p>
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#4f46e5;text-transform:uppercase;">${actionLabels[lang]}</p>
        <p style="margin:0;font-size:13px;color:#374151;line-height:1.5;">${explanation.action}</p>
      </div>`;
  }

  // Remaining events: headlines only (muted)
  const restRows = events.slice(1).map((e) => {
    const eIcon = EVENT_ICONS[e.event_type] ?? "📌";
    const text = renderEventText(e, locale);
    return `<tr><td style="padding:6px 0;font-size:13px;color:#9ca3af;">${eIcon} ${text}</td></tr>`;
  }).join("");

  const restSection = events.length > 1 ? `
    <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e4e4e7;">
      <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;font-weight:500;">+${events.length - 1} ${moreLabel}</p>
      <table style="width:100%;border-collapse:collapse;">${restRows}</table>
    </div>` : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
    <div style="background:#4f46e5;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">${title}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Vectorial Data</p>
    </div>
    <div style="padding:16px 24px;">
      <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111827;">${icon} ${headline}</p>
      ${explanationHtml}
      ${restSection}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e4e4e7;text-align:center;">
      <a href="https://www.vectorialdata.com/join" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">${ctaLabel}</a>
    </div>
    <div style="padding:12px 24px;text-align:center;font-size:11px;color:#a1a1aa;">
      <p style="margin:0;">Vectorial Data — Stock Portfolio</p>
      <p style="margin:4px 0 0;">This is not financial advice.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendDigestEmail(
  to: string,
  events: PortfolioEvent[],
  locale = "en",
  isSubscribed = true
) {
  const subjectLines: Record<string, string> = {
    en: "Your portfolio this week — Vectorial Data",
    es: "Tu portafolio esta semana — Vectorial Data",
    pt: "Seu portfólio esta semana — Vectorial Data",
    hi: "इस सप्ताह आपका पोर्टफोलियो — Vectorial Data",
  };

  const lang = subjectLines[locale] ? locale : "en";

  const { error } = await getResend().emails.send({
    from: "Vectorial Data <notifications@vectorialdata.com>",
    to,
    subject: subjectLines[lang],
    html: isSubscribed ? buildDigestHtml(events, locale) : buildFreeDigestHtml(events, locale),
  });

  if (error) throw new Error(`Failed to send digest: ${error.message}`);
}
