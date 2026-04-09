import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { google } from "googleapis";

function getGA4Client() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!email || !key || !propertyId) return null;
  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: email,
      private_key: key.replace(/\\n/g, "\n"),
    },
  });
  return { client, property: `properties/${propertyId}` };
}

// ─── GA4 Data (weekly full report) ───

export interface GA4Data {
  pageViews: number;
  sessions: number;
  users: number;
  newUsers: number;
  topPages: { path: string; views: number }[];
  topCountries: { country: string; users: number }[];
  trafficSources: { source: string; sessions: number }[];
  devices: { device: string; sessions: number }[];
}

export async function fetchGA4Data(daysBack = 7): Promise<GA4Data | null> {
  const ga4 = getGA4Client();
  if (!ga4) return null;

  try {
    const { client, property } = ga4;
    const startDate = `${daysBack}daysAgo`;
    const endDate = "today";

    // Totals: pageViews, sessions, users, newUsers
    const [totals] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "activeUsers" },
        { name: "newUsers" },
      ],
    });

    const row = totals.rows?.[0];
    const pageViews = parseInt(row?.metricValues?.[0]?.value ?? "0");
    const sessions = parseInt(row?.metricValues?.[1]?.value ?? "0");
    const users = parseInt(row?.metricValues?.[2]?.value ?? "0");
    const newUsers = parseInt(row?.metricValues?.[3]?.value ?? "0");

    // Top pages
    const [pages] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    });

    const topPages = (pages.rows ?? []).map((r) => ({
      path: r.dimensionValues?.[0]?.value ?? "",
      views: parseInt(r.metricValues?.[0]?.value ?? "0"),
    }));

    // Top countries
    const [countries] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: 10,
    });

    const topCountries = (countries.rows ?? []).map((r) => ({
      country: r.dimensionValues?.[0]?.value ?? "",
      users: parseInt(r.metricValues?.[0]?.value ?? "0"),
    }));

    // Traffic sources
    const [sources] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    });

    const trafficSources = (sources.rows ?? []).map((r) => ({
      source: r.dimensionValues?.[0]?.value ?? "",
      sessions: parseInt(r.metricValues?.[0]?.value ?? "0"),
    }));

    // Devices
    const [deviceData] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });

    const devices = (deviceData.rows ?? []).map((r) => ({
      device: r.dimensionValues?.[0]?.value ?? "",
      sessions: parseInt(r.metricValues?.[0]?.value ?? "0"),
    }));

    return { pageViews, sessions, users, newUsers, topPages, topCountries, trafficSources, devices };
  } catch (error) {
    console.error("GA4 fetch error:", error);
    return null;
  }
}

// ─── GA4 Daily Traffic (yesterday's data for daily brief) ───

export interface GA4DailyTraffic {
  pageViews: number;
  sessions: number;
  users: number;
  newUsers: number;
  topSource: string;
  topSourceSessions: number;
  sources: { source: string; sessions: number }[];
}

export async function fetchGA4DailyTraffic(): Promise<GA4DailyTraffic | null> {
  const ga4 = getGA4Client();
  if (!ga4) return null;

  try {
    const { client, property } = ga4;

    // Yesterday's totals
    const [totals] = await client.runReport({
      property,
      dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "activeUsers" },
        { name: "newUsers" },
      ],
    });

    const row = totals.rows?.[0];
    const pageViews = parseInt(row?.metricValues?.[0]?.value ?? "0");
    const sessions = parseInt(row?.metricValues?.[1]?.value ?? "0");
    const users = parseInt(row?.metricValues?.[2]?.value ?? "0");
    const newUsers = parseInt(row?.metricValues?.[3]?.value ?? "0");

    // Yesterday's traffic sources
    const [sourcesData] = await client.runReport({
      property,
      dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 5,
    });

    const sources = (sourcesData.rows ?? []).map((r) => ({
      source: r.dimensionValues?.[0]?.value ?? "",
      sessions: parseInt(r.metricValues?.[0]?.value ?? "0"),
    }));

    const topSource = sources[0]?.source ?? "—";
    const topSourceSessions = sources[0]?.sessions ?? 0;

    return { pageViews, sessions, users, newUsers, topSource, topSourceSessions, sources };
  } catch (error) {
    console.error("GA4 daily traffic error:", error);
    return null;
  }
}

// ─── Google Search Console Data ───

export interface GSCData {
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averagePosition: number;
  topQueries: { query: string; clicks: number; impressions: number; position: number }[];
  topPages: { page: string; clicks: number; impressions: number }[];
}

export async function fetchGSCData(daysBack = 7): Promise<GSCData | null> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const siteUrl = process.env.GSC_SITE_URL;

  if (!email || !key || !siteUrl) return null;

  try {
    const auth = new google.auth.JWT({
      email,
      key: key.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });

    const searchconsole = google.searchconsole({ version: "v1", auth });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    // GSC data has ~3 day lag
    endDate.setDate(endDate.getDate() - 3);

    const dateFormat = (d: Date) => d.toISOString().split("T")[0];

    // Top queries
    const queriesRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: dateFormat(startDate),
        endDate: dateFormat(endDate),
        dimensions: ["query"],
        rowLimit: 10,
      },
    });

    const topQueries = (queriesRes.data.rows ?? []).map((r) => ({
      query: r.keys?.[0] ?? "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      position: Math.round((r.position ?? 0) * 10) / 10,
    }));

    // Top pages
    const pagesRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: dateFormat(startDate),
        endDate: dateFormat(endDate),
        dimensions: ["page"],
        rowLimit: 10,
      },
    });

    const topPages = (pagesRes.data.rows ?? []).map((r) => ({
      page: (r.keys?.[0] ?? "").replace("https://www.vectorialdata.com", "").replace("https://vectorialdata.com", ""),
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
    }));

    // Totals
    const totalClicks = topQueries.reduce((s, q) => s + q.clicks, 0);
    const totalImpressions = topQueries.reduce((s, q) => s + q.impressions, 0);
    const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const averagePosition = topQueries.length > 0
      ? topQueries.reduce((s, q) => s + q.position, 0) / topQueries.length
      : 0;

    return { totalClicks, totalImpressions, averageCTR, averagePosition, topQueries, topPages };
  } catch (error) {
    console.error("GSC fetch error:", error);
    return null;
  }
}
