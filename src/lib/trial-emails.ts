import { Resend } from "resend";

// Self-contained Resend client so we don't touch src/lib/resend.ts.
// Same env key and sender identity as the rest of the app.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not configured");
    _resend = new Resend(key);
  }
  return _resend;
}

const SITE = "https://vectorialdata.com";
const FROM = "Vectorial Data <notifications@mail.vectorialdata.com>";

export type TrialReminderKind = "halfway" | "ending" | "expired";

type Copy = { subject: string; heading: string; body: string; button: string };

// es is the source of truth; en + pt mirror it. Plain language, no jargon.
const COPY: Record<string, Record<TrialReminderKind, Copy>> = {
  es: {
    halfway: {
      subject: "Vas a la mitad de tu prueba de Vectorial Data",
      heading: "Te quedan unos días de prueba",
      body: "Sigues con acceso completo: el research del porqué de cada pick y los picks en cuanto salen. Cuando termine la prueba, puedes continuar por solo $1 al mes.",
      button: "Continuar por $1/mes",
    },
    ending: {
      subject: "Tu prueba termina mañana",
      heading: "Último día de prueba",
      body: "Mañana termina tu prueba gratuita. Para no perder los picks ni el research, suscríbete por solo $1 al mes. Sin compromisos, cancela cuando quieras.",
      button: "Suscribirme · $1/mes",
    },
    expired: {
      subject: "Tu prueba terminó — reactiva cuando quieras",
      heading: "Tu prueba terminó",
      body: "Tu acceso premium quedó en pausa. Tu portafolio sigue siendo público, y puedes reactivar el research y los picks por solo $1 al mes cuando quieras.",
      button: "Reactivar · $1/mes",
    },
  },
  en: {
    halfway: {
      subject: "You're halfway through your Vectorial Data trial",
      heading: "A few days left in your trial",
      body: "You still have full access: the research behind every pick and each pick as soon as it drops. When the trial ends, keep going for just $1/month.",
      button: "Continue for $1/mo",
    },
    ending: {
      subject: "Your trial ends tomorrow",
      heading: "Last day of your trial",
      body: "Your free trial ends tomorrow. To keep the picks and the research, subscribe for just $1/month. No commitment, cancel anytime.",
      button: "Subscribe · $1/mo",
    },
    expired: {
      subject: "Your trial ended — reactivate anytime",
      heading: "Your trial ended",
      body: "Your premium access is paused. Your portfolio stays public, and you can reactivate the research and picks for just $1/month whenever you like.",
      button: "Reactivate · $1/mo",
    },
  },
  pt: {
    halfway: {
      subject: "Você está na metade do seu teste da Vectorial Data",
      heading: "Faltam poucos dias do seu teste",
      body: "Você ainda tem acesso completo: a análise do porquê de cada pick e os picks assim que saem. Quando o teste acabar, continue por apenas US$1 por mês.",
      button: "Continuar por US$1/mês",
    },
    ending: {
      subject: "Seu teste termina amanhã",
      heading: "Último dia do seu teste",
      body: "Seu teste gratuito termina amanhã. Para não perder os picks e a análise, assine por apenas US$1 por mês. Sem compromisso, cancele quando quiser.",
      button: "Assinar · US$1/mês",
    },
    expired: {
      subject: "Seu teste terminou — reative quando quiser",
      heading: "Seu teste terminou",
      body: "Seu acesso premium foi pausado. Seu portfólio continua público, e você pode reativar a análise e os picks por apenas US$1 por mês quando quiser.",
      button: "Reativar · US$1/mês",
    },
  },
};

function buildHtml(c: Copy, ctaUrl: string): string {
  return `<!DOCTYPE html>
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
  <tr><td style="padding:24px 32px 8px;">
    <table cellpadding="0" cellspacing="0"><tr><td>
      <a href="${ctaUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;">
        ${c.button}
      </a>
    </td></tr></table>
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
}

export async function sendTrialReminderEmail(
  email: string,
  kind: TrialReminderKind,
  locale: string = "es"
): Promise<void> {
  const l = locale in COPY ? locale : "es";
  const c = COPY[l][kind];
  const ctaUrl = `${SITE}/join`;

  const { error } = await getResend().emails.send({
    from: FROM,
    replyTo: "Hello@vectorialdata.com",
    to: email,
    subject: c.subject,
    html: buildHtml(c, ctaUrl),
  });

  if (error) throw new Error(`Failed to send trial-${kind} email: ${error.message}`);
}
