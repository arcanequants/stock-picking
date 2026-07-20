// Pure logic for the weekly SEO email (cron: /api/cron/seo-weekly).
// Takes raw Google Search Console rows for two week-long ranges per property
// and produces the metrics + Spanish HTML email. No I/O here — the route does
// the GSC fetching and the Resend send — so this file is unit-testable.

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  position: number; // average position, 1 = top
}

export interface GscPageRow {
  page: string;
  clicks: number;
  impressions: number;
}

export interface SubdomainReportInput {
  /** Human label, e.g. "terminal.vectorialdata.com" */
  label: string;
  /** When true, render top queries/pages for this subdomain (or "sin datos aún"). */
  detail?: boolean;
  currentTotals: { clicks: number; impressions: number };
  previousTotals: { clicks: number; impressions: number };
  currentQueries: GscQueryRow[];
  currentPages: GscPageRow[];
}

export interface PropertyReportInput {
  /** Human label, e.g. "vectorialdata.com" */
  label: string;
  /** GSC property id, e.g. "sc-domain:vectorialdata.com" */
  property: string;
  currentTotals: { clicks: number; impressions: number };
  previousTotals: { clicks: number; impressions: number };
  currentQueries: GscQueryRow[];
  previousQueries: GscQueryRow[];
  currentPages: GscPageRow[];
  /**
   * Optional split of the same property (e.g. main site vs terminal subdomain).
   * The property totals above stay combined for historic comparability; these
   * render as an extra breakdown below them.
   */
  subdomains?: SubdomainReportInput[];
}

export interface SubdomainSummary {
  label: string;
  detail: boolean;
  clicks: number;
  impressions: number;
  clicksDeltaPct: number | null;
  impressionsDeltaPct: number | null;
  topQueries: GscQueryRow[];
  topPages: GscPageRow[];
}

export interface PropertySummary {
  label: string;
  clicks: number;
  impressions: number;
  /** Percent WoW change; null when the previous week had zero (no baseline). */
  clicksDeltaPct: number | null;
  impressionsDeltaPct: number | null;
  /** Top 5 queries of the current week by impressions. */
  topQueries: GscQueryRow[];
  /** Queries present this week but absent the previous week (top 10 by impressions). */
  newQueries: GscQueryRow[];
  /** Position 8–25 with impressions >= 5 — "page 2" keywords worth pushing. */
  page2Candidates: GscQueryRow[];
  /** Top 10 pages of the current week by clicks. */
  topPages: GscPageRow[];
  /** One-line "qué significa" heuristic in Spanish. */
  insight: string;
  /** Optional subdomain breakdown (rendered below the combined totals). */
  subdomains?: SubdomainSummary[];
}

function deltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export function computePropertySummary(input: PropertyReportInput): PropertySummary {
  const { currentTotals, previousTotals } = input;

  const topQueries = [...input.currentQueries]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5);

  const previousSet = new Set(input.previousQueries.map((q) => q.query));
  const newQueries = input.currentQueries
    .filter((q) => !previousSet.has(q.query))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  const page2Candidates = input.currentQueries
    .filter((q) => q.position >= 8 && q.position <= 25 && q.impressions >= 5)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  const topPages = [...input.currentPages]
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, 10);

  const impressionsDeltaPct = deltaPct(currentTotals.impressions, previousTotals.impressions);
  const clicksDeltaPct = deltaPct(currentTotals.clicks, previousTotals.clicks);

  // "Qué significa" — a single plain-Spanish line.
  const parts: string[] = [];
  if (impressionsDeltaPct === null) {
    if (currentTotals.impressions > 0) {
      parts.push("Primera semana con datos: Google ya está mostrando el sitio.");
    } else {
      parts.push("Sin impresiones todavía — Google aún no muestra el sitio en resultados.");
    }
  } else if (impressionsDeltaPct > 20) {
    parts.push(
      `Las impresiones subieron ${impressionsDeltaPct.toFixed(0)}% vs. la semana anterior: la visibilidad en Google está creciendo.`
    );
  } else if (impressionsDeltaPct < -20) {
    parts.push(
      `Las impresiones cayeron ${Math.abs(impressionsDeltaPct).toFixed(0)}% vs. la semana anterior: vale revisar posiciones o estacionalidad.`
    );
  } else {
    parts.push("Visibilidad estable semana contra semana.");
  }
  if (page2Candidates.length > 0) {
    parts.push(
      `${page2Candidates.length} consulta${page2Candidates.length === 1 ? "" : "s"} en página 2 (posición 8–25) — candidatas a empujar con contenido o enlaces internos.`
    );
  }
  if (newQueries.length > 0) {
    parts.push(`${newQueries.length} consulta${newQueries.length === 1 ? "" : "s"} nueva${newQueries.length === 1 ? "" : "s"} esta semana.`);
  }

  const subdomains = input.subdomains?.map((s): SubdomainSummary => ({
    label: s.label,
    detail: s.detail ?? false,
    clicks: s.currentTotals.clicks,
    impressions: s.currentTotals.impressions,
    clicksDeltaPct: deltaPct(s.currentTotals.clicks, s.previousTotals.clicks),
    impressionsDeltaPct: deltaPct(s.currentTotals.impressions, s.previousTotals.impressions),
    topQueries: [...s.currentQueries].sort((a, b) => b.impressions - a.impressions).slice(0, 5),
    topPages: [...s.currentPages]
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
      .slice(0, 5),
  }));

  return {
    label: input.label,
    clicks: currentTotals.clicks,
    impressions: currentTotals.impressions,
    clicksDeltaPct,
    impressionsDeltaPct,
    topQueries,
    newQueries,
    page2Candidates,
    topPages,
    insight: parts.join(" "),
    subdomains,
  };
}

// ─── HTML rendering (inline styles, es) ───

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtInt(n: number): string {
  return n.toLocaleString("es-MX");
}

function fmtDelta(pct: number | null): string {
  if (pct === null) return `<span style="color:#9ca3af;">— nuevo</span>`;
  const up = pct >= 0;
  const color = up ? "#059669" : "#dc2626";
  const arrow = up ? "▲" : "▼";
  return `<span style="color:${color};font-weight:600;">${arrow} ${Math.abs(pct).toFixed(1)}%</span>`;
}

const TH = `text-align:left;padding:6px 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;border-bottom:1px solid #e4e4e7;`;
const TD = `padding:6px 10px;font-size:13px;color:#111827;border-bottom:1px solid #f1f1f4;`;
const TD_NUM = `${TD}text-align:right;font-variant-numeric:tabular-nums;`;

function queriesTable(title: string, rows: GscQueryRow[], emptyMsg: string): string {
  if (rows.length === 0) {
    return `<p style="margin:16px 0 4px;font-size:13px;font-weight:600;color:#374151;">${title}</p>
<p style="margin:0;font-size:13px;color:#9ca3af;">${emptyMsg}</p>`;
  }
  const body = rows
    .map(
      (r) => `<tr>
  <td style="${TD}">${esc(r.query)}</td>
  <td style="${TD_NUM}">${fmtInt(r.clicks)}</td>
  <td style="${TD_NUM}">${fmtInt(r.impressions)}</td>
  <td style="${TD_NUM}">${r.position.toFixed(1)}</td>
</tr>`
    )
    .join("");
  return `<p style="margin:16px 0 4px;font-size:13px;font-weight:600;color:#374151;">${title}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <tr><th style="${TH}">Consulta</th><th style="${TH}text-align:right;">Clics</th><th style="${TH}text-align:right;">Impresiones</th><th style="${TH}text-align:right;">Posición</th></tr>
  ${body}
</table>`;
}

function pagesTable(rows: GscPageRow[], title = "Páginas principales"): string {
  if (rows.length === 0) {
    return `<p style="margin:16px 0 4px;font-size:13px;font-weight:600;color:#374151;">${esc(title)}</p>
<p style="margin:0;font-size:13px;color:#9ca3af;">Sin datos de páginas esta semana.</p>`;
  }
  const body = rows
    .map((r) => {
      const short = r.page.replace(/^https?:\/\/(www\.)?[^/]+/, "") || "/";
      return `<tr>
  <td style="${TD}word-break:break-all;">${esc(short)}</td>
  <td style="${TD_NUM}">${fmtInt(r.clicks)}</td>
  <td style="${TD_NUM}">${fmtInt(r.impressions)}</td>
</tr>`;
    })
    .join("");
  return `<p style="margin:16px 0 4px;font-size:13px;font-weight:600;color:#374151;">${esc(title)}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <tr><th style="${TH}">Página</th><th style="${TH}text-align:right;">Clics</th><th style="${TH}text-align:right;">Impresiones</th></tr>
  ${body}
</table>`;
}

function subdomainBreakdown(subs: SubdomainSummary[]): string {
  const rows = subs
    .map(
      (s) => `<tr>
  <td style="${TD}">${esc(s.label)}</td>
  <td style="${TD_NUM}">${fmtInt(s.clicks)} ${fmtDelta(s.clicksDeltaPct)}</td>
  <td style="${TD_NUM}">${fmtInt(s.impressions)} ${fmtDelta(s.impressionsDeltaPct)}</td>
</tr>`
    )
    .join("");
  const detailBlocks = subs
    .filter((s) => s.detail)
    .map((s) => {
      if (s.impressions <= 0) {
        return `<p style="margin:12px 0 0;font-size:13px;color:#9ca3af;">${esc(s.label)}: sin datos aún — Google todavía no muestra este subdominio en resultados.</p>`;
      }
      return `${queriesTable(`${s.label} — top consultas`, s.topQueries, "Sin consultas registradas esta semana.")}
${pagesTable(s.topPages, `${s.label} — páginas principales`)}`;
    })
    .join("");
  return `<p style="margin:16px 0 4px;font-size:13px;font-weight:600;color:#374151;">Desglose por subdominio</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <tr><th style="${TH}">Subdominio</th><th style="${TH}text-align:right;">Clics</th><th style="${TH}text-align:right;">Impresiones</th></tr>
  ${rows}
</table>
${detailBlocks}`;
}

function propertySection(s: PropertySummary): string {
  return `<tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;">
  <h2 style="margin:0 0 12px;font-size:17px;color:#111827;">${esc(s.label)}</h2>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:4px;">
    <tr>
      <td style="padding:10px 14px;background:#f8f8fa;border-radius:8px;" width="49%">
        <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">Clics</p>
        <p style="margin:2px 0 0;font-size:22px;font-weight:700;color:#111827;">${fmtInt(s.clicks)} <span style="font-size:13px;">${fmtDelta(s.clicksDeltaPct)}</span></p>
      </td>
      <td width="2%"></td>
      <td style="padding:10px 14px;background:#f8f8fa;border-radius:8px;" width="49%">
        <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">Impresiones</p>
        <p style="margin:2px 0 0;font-size:22px;font-weight:700;color:#111827;">${fmtInt(s.impressions)} <span style="font-size:13px;">${fmtDelta(s.impressionsDeltaPct)}</span></p>
      </td>
    </tr>
  </table>
  <p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:#374151;"><strong>Qué significa:</strong> ${esc(s.insight)}</p>
  ${s.subdomains && s.subdomains.length > 0 ? subdomainBreakdown(s.subdomains) : ""}
  ${queriesTable("Top 5 consultas (por impresiones)", s.topQueries, "Sin consultas registradas esta semana.")}
  ${queriesTable("Consultas nuevas esta semana", s.newQueries, "Ninguna consulta nueva vs. la semana anterior.")}
  ${queriesTable("Oportunidades de página 2 (posición 8–25, ≥5 impresiones)", s.page2Candidates, "Ninguna consulta en rango de página 2 todavía.")}
  ${pagesTable(s.topPages)}
</td></tr>`;
}

export interface ReportRange {
  /** Current week, ISO dates (inclusive). */
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
}

export function buildSeoWeeklyHtml(summaries: PropertySummary[], range: ReportRange): string {
  const sections = summaries.map(propertySection).join("");
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
  <tr><td style="padding:28px 32px 16px;">
    <h1 style="margin:0;font-size:20px;color:#111827;">Reporte SEO semanal — Vectorial + AgentMetrics</h1>
    <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Semana ${range.currentStart} → ${range.currentEnd} · comparada con ${range.previousStart} → ${range.previousEnd}</p>
  </td></tr>
  ${sections}
  <tr><td style="padding:16px 32px 24px;border-top:1px solid #e4e4e7;">
    <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">Fuente: Google Search Console. Los datos de Search Console llegan con ~2 días de retraso, por eso la semana reportada termina 2 días antes de hoy. Este correo se genera automáticamente cada lunes.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildSubject(summaries: PropertySummary[]): string {
  const parts = summaries.map(
    (s) => `${s.label} ${fmtInt(s.clicks)} clics/${fmtInt(s.impressions)} impr`
  );
  return `SEO semanal: ${parts.join(" · ")}`;
}
