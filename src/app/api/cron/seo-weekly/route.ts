import { NextResponse } from "next/server";
import { google } from "googleapis";
import { sendSeoWeeklyReport } from "@/lib/resend";
import {
  buildSeoWeeklyHtml,
  buildSubject,
  computePropertySummary,
  type GscPageRow,
  type GscQueryRow,
  type PropertyReportInput,
  type ReportRange,
  type SubdomainReportInput,
} from "@/lib/seo-weekly-report";

// Weekly SEO email — pulls Google Search Console data for BOTH properties
// (vectorialdata.com + agentmetrics.co) and emails a Spanish summary.
// Scheduled in vercel.json: Mondays 14:17 UTC (~8:17am Mexico City).
//
// Required env vars:
//   - CRON_SECRET               — Vercel sends it as `Authorization: Bearer <secret>`
//                                 on cron invocations when this env var exists.
//   - GSC_SERVICE_ACCOUNT_JSON  — full Google service-account key JSON (as a string).
//                                 The service account must be added as a user (read
//                                 permission is enough) on BOTH Search Console
//                                 properties. Scope used: webmasters.readonly.
//   - RESEND_API_KEY            — already configured (shared transactional email).
//   - SEO_REPORT_EMAIL          — optional recipient override.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REPORT_EMAIL = process.env.SEO_REPORT_EMAIL || "mcuyutlan@gmail.com";

// Page-dimension filter used to split one GSC property into subdomain views.
// Operators per the Search Analytics API: "contains" / "notContains".
interface SubdomainConfig {
  label: string;
  operator: "contains" | "notContains";
  expression: string;
  /** Render top queries/pages for this split (or "sin datos aún"). */
  detail?: boolean;
}

const PROPERTIES: {
  label: string;
  property: string;
  subdomains?: SubdomainConfig[];
}[] = [
  {
    label: "vectorialdata.com",
    property: "sc-domain:vectorialdata.com",
    // The domain property also covers terminal.vectorialdata.com; split it out
    // so we can watch the terminal grow. Combined totals stay as-is above.
    subdomains: [
      {
        label: "vectorialdata.com (sitio)",
        operator: "notContains",
        expression: "terminal.vectorialdata.com",
      },
      {
        label: "terminal.vectorialdata.com",
        operator: "contains",
        expression: "terminal.vectorialdata.com",
        detail: true,
      },
    ],
  },
  { label: "agentmetrics.co", property: "https://agentmetrics.co/" },
];

// GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in Vercel once shipped with mangled PEM
// (see src/lib/google-analytics.ts). Apply the same defensive rebuild to the
// key inside GSC_SERVICE_ACCOUNT_JSON: strip whitespace, re-wrap base64 at 64.
function normalizePrivateKey(raw: string): string {
  let k = raw.trim().replace(/\\+n/g, "\n");
  const stripped = k.replace(/\s+/g, "");
  const m = stripped.match(
    /-----BEGIN[A-Z]*PRIVATEKEY-----(.+?)-----END[A-Z]*PRIVATEKEY-----/
  );
  const payload = m?.[1];
  if (!payload) return k;
  const body = payload.match(/.{1,64}/g)?.join("\n") ?? payload;
  return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;
}

function getSearchConsoleClient() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) throw new Error("GSC_SERVICE_ACCOUNT_JSON not configured");
  let creds: { client_email?: string; private_key?: string };
  try {
    creds = JSON.parse(raw);
  } catch {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!creds.client_email || !creds.private_key) {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON missing client_email/private_key");
  }
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: normalizePrivateKey(creds.private_key),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  return google.searchconsole({ version: "v1", auth });
}

type SearchConsole = ReturnType<typeof getSearchConsoleClient>;

const iso = (d: Date) => d.toISOString().split("T")[0];

async function queryRows(
  sc: SearchConsole,
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[] | undefined,
  rowLimit: number,
  pageFilter?: { operator: "contains" | "notContains"; expression: string }
) {
  const res = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions,
      rowLimit,
      ...(pageFilter
        ? {
            dimensionFilterGroups: [
              {
                filters: [
                  {
                    dimension: "page",
                    operator: pageFilter.operator,
                    expression: pageFilter.expression,
                  },
                ],
              },
            ],
          }
        : {}),
    },
  });
  return res.data.rows ?? [];
}

const toQueryRow = (r: {
  keys?: string[] | null;
  clicks?: number | null;
  impressions?: number | null;
  position?: number | null;
}): GscQueryRow => ({
  query: r.keys?.[0] ?? "",
  clicks: r.clicks ?? 0,
  impressions: r.impressions ?? 0,
  position: r.position ?? 0,
});

const toPageRow = (r: {
  keys?: string[] | null;
  clicks?: number | null;
  impressions?: number | null;
}): GscPageRow => ({
  page: r.keys?.[0] ?? "",
  clicks: r.clicks ?? 0,
  impressions: r.impressions ?? 0,
});

const toTotals = (rows: { clicks?: number | null; impressions?: number | null }[]) => ({
  clicks: rows[0]?.clicks ?? 0,
  impressions: rows[0]?.impressions ?? 0,
});

async function fetchSubdomainInput(
  sc: SearchConsole,
  property: string,
  config: SubdomainConfig,
  range: ReportRange
): Promise<SubdomainReportInput> {
  const filter = { operator: config.operator, expression: config.expression };
  const [totalsCur, totalsPrev, queriesCur, pagesCur] = await Promise.all([
    // Totals need the page dimension for the filter to apply; sum the rows.
    queryRows(sc, property, range.currentStart, range.currentEnd, ["page"], 1000, filter),
    queryRows(sc, property, range.previousStart, range.previousEnd, ["page"], 1000, filter),
    queryRows(sc, property, range.currentStart, range.currentEnd, ["query"], 50, filter),
    queryRows(sc, property, range.currentStart, range.currentEnd, ["page"], 25, filter),
  ]);
  const sum = (rows: { clicks?: number | null; impressions?: number | null }[]) =>
    rows.reduce<{ clicks: number; impressions: number }>(
      (acc, r) => ({
        clicks: acc.clicks + (r.clicks ?? 0),
        impressions: acc.impressions + (r.impressions ?? 0),
      }),
      { clicks: 0, impressions: 0 }
    );
  return {
    label: config.label,
    detail: config.detail,
    currentTotals: sum(totalsCur),
    previousTotals: sum(totalsPrev),
    currentQueries: queriesCur.map(toQueryRow),
    currentPages: pagesCur.map(toPageRow),
  };
}

async function fetchPropertyInput(
  sc: SearchConsole,
  label: string,
  property: string,
  range: ReportRange,
  subdomainConfigs?: SubdomainConfig[]
): Promise<PropertyReportInput> {
  const [totalsCur, totalsPrev, queriesCur, queriesPrev, pagesCur, subdomains] =
    await Promise.all([
      // No dimensions → single row with true totals (includes anonymized queries).
      queryRows(sc, property, range.currentStart, range.currentEnd, undefined, 1),
      queryRows(sc, property, range.previousStart, range.previousEnd, undefined, 1),
      queryRows(sc, property, range.currentStart, range.currentEnd, ["query"], 100),
      queryRows(sc, property, range.previousStart, range.previousEnd, ["query"], 100),
      queryRows(sc, property, range.currentStart, range.currentEnd, ["page"], 50),
      subdomainConfigs
        ? Promise.all(subdomainConfigs.map((c) => fetchSubdomainInput(sc, property, c, range)))
        : Promise.resolve(undefined),
    ]);

  return {
    label,
    property,
    currentTotals: toTotals(totalsCur),
    previousTotals: toTotals(totalsPrev),
    currentQueries: queriesCur.map(toQueryRow),
    previousQueries: queriesPrev.map(toQueryRow),
    currentPages: pagesCur.map(toPageRow),
    subdomains,
  };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // GSC data lags ~2 days: current week = [today-8, today-2] (7 days),
  // previous week = [today-15, today-9].
  const day = (offset: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - offset);
    return d;
  };
  const range: ReportRange = {
    currentStart: iso(day(8)),
    currentEnd: iso(day(2)),
    previousStart: iso(day(15)),
    previousEnd: iso(day(9)),
  };

  try {
    const sc = getSearchConsoleClient();
    const summaries = await Promise.all(
      PROPERTIES.map(async ({ label, property, subdomains }) =>
        computePropertySummary(
          await fetchPropertyInput(sc, label, property, range, subdomains)
        )
      )
    );

    await sendSeoWeeklyReport(
      REPORT_EMAIL,
      buildSubject(summaries),
      buildSeoWeeklyHtml(summaries, range)
    );

    return NextResponse.json({
      ok: true,
      sentTo: REPORT_EMAIL,
      range,
      properties: summaries.map((s) => ({
        label: s.label,
        clicks: s.clicks,
        impressions: s.impressions,
      })),
    });
  } catch (error) {
    // Terse error, no secrets — keys/tokens never appear in these messages.
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("seo-weekly cron failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
