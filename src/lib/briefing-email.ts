import { Resend } from "resend";

const FROM = "Vectorial Data <notifications@mail.vectorialdata.com>";
const TO = "mcuyutlan@gmail.com";

export type BriefingDraft = { n: number; region: string; text: string };
export type BriefingTableRow = {
  n: number;
  region: string;
  angle: string;
  worker?: string;
};
export type BriefingPayload = {
  date: string;
  summary?: string;
  causalChain?: string;
  table?: BriefingTableRow[];
  drafts: BriefingDraft[];
};

const escape = (s: unknown) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function buildBriefingHtml(b: BriefingPayload): string {
  const drafts = b.drafts;
  const tableRows: BriefingTableRow[] =
    b.table ??
    drafts.map((d) => ({
      n: d.n,
      region: d.region,
      angle: d.text.split("\n")[0].slice(0, 110),
      worker: "—",
    }));
  const summary = b.summary ?? "Briefing generado por el cron diario.";
  const causalChain = b.causalChain ?? "";

  const draftCards = drafts
    .map(
      (d) => `
  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0;background:#fafafa">
    <div style="font-size:12px;color:#6b7280;margin-bottom:6px">
      <strong>Draft #${d.n}</strong> · ${escape(d.region)} · ${d.text.length} chars
    </div>
    <pre style="white-space:pre-wrap;word-wrap:break-word;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.5;margin:0;color:#111">${escape(d.text)}</pre>
  </div>`,
    )
    .join("");

  const tableHtml = tableRows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px;border:1px solid #e5e7eb">${escape(r.n)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${escape(r.region)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${escape(r.angle)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${escape(r.worker ?? "—")}</td>
      </tr>`,
    )
    .join("");

  const fmtDate = new Date(b.date + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#111">
  <h1 style="font-size:22px;margin:0 0 8px 0">Briefing Vectorial Data — ${escape(fmtDate)}</h1>
  <p style="color:#6b7280;margin:0 0 24px 0">${drafts.length} ángulos · ${drafts.length} drafts X listos para copiar y pegar</p>

  <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin-bottom:24px">
    <strong>📌 Tema del día:</strong> ${escape(summary)}
  </div>

  <h2 style="font-size:18px;margin-top:32px">Drafts X (zero jargon · inglés · listos para copiar)</h2>
  <p style="color:#6b7280;font-size:14px;margin-top:0">Cada draft explica algo difícil de manera simple. Si después de leerlo sientes "ah, qué interesante, lo entendí" → sirve. Si tienes que googlear algo → falla, dímelo y lo reescribo desde cero.</p>
  ${draftCards}

  <h2 style="font-size:18px;margin-top:48px">📊 Tabla consolidada — todos los ángulos del día</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px">
    <thead>
      <tr style="background:#f3f4f6">
        <th style="text-align:left;padding:8px;border:1px solid #e5e7eb">#</th>
        <th style="text-align:left;padding:8px;border:1px solid #e5e7eb">Región</th>
        <th style="text-align:left;padding:8px;border:1px solid #e5e7eb">Ángulo</th>
        <th style="text-align:left;padding:8px;border:1px solid #e5e7eb">Worker</th>
      </tr>
    </thead>
    <tbody>${tableHtml}</tbody>
  </table>

  ${causalChain ? `<h2 style="font-size:18px;margin-top:48px">🔗 Cadena causal del día</h2>
  <p style="font-size:14px;line-height:1.6;color:#374151">${escape(causalChain)}</p>` : ""}

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:48px 0 16px 0">
  <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
    Briefing automático generado a las 6am CDMX · claude.ai routine<br>
    Forwarded by stock-picking/api/marketing/forward-briefing
  </p>
</body></html>`;
}

export async function sendBriefingEmail(payload: BriefingPayload) {
  const fmtDate = new Date(payload.date + "T00:00:00").toLocaleDateString(
    "es-MX",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
  const subject = `Briefing Vectorial Data — ${fmtDate} (${payload.drafts.length} drafts X listos)`;

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const result = await resend.emails.send({
    from: FROM,
    to: TO,
    subject,
    html: buildBriefingHtml(payload),
  });
  return { id: result.data?.id, drafts: payload.drafts.length };
}
