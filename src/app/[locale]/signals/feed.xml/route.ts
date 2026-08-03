import {
  listLiveSignals,
  listRecentObservationsAcrossSignals,
  pickCopyCasual,
  type SignalDefinition,
  type SignalObservation,
} from "@/lib/signals";

const SITE_URL = "https://vectorialdata.com";
const FEED_TITLE = "Vectorial Signals";
const FEED_DESC =
  "Alternative-data signals from public satellites, AIS, EIA, USDA, and TROPOMI — cleaned, baselined, translated. Descriptive market intelligence, not investment advice.";
const FEED_URL = `${SITE_URL}/signals/feed.xml`;
const FEED_SELF_HTML = `${SITE_URL}/signals`;

export const dynamic = "force-dynamic";
export const revalidate = 300;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmtValue(value: number, decimals: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function buildItem(def: SignalDefinition, obs: SignalObservation): string {
  const casual = pickCopyCasual(def.copy, "en");
  const valueDisplay = `${fmtValue(Number(obs.value), def.display_decimals)} ${def.unit}`;
  const title = `${casual.title || def.name}: ${valueDisplay}`;
  const link = `${SITE_URL}/signals/${def.id}`;
  const description = casual.translation || casual.tagline || def.name;
  const pubDate = new Date(obs.observed_at).toUTCString();
  // guid combines signal + date so each new observation is a new feed item
  const guid = `${link}#${obs.observed_at}`;

  return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(def.domain)}</category>
    </item>`;
}

export async function GET() {
  const [signals, observations] = await Promise.all([
    listLiveSignals(),
    listRecentObservationsAcrossSignals(50),
  ]);

  const signalsById = new Map(signals.map((s) => [s.id, s]));
  const items = observations
    .map((obs) => {
      const def = signalsById.get(obs.signal_id);
      if (!def) return null;
      return buildItem(def, obs);
    })
    .filter(Boolean)
    .join("\n");

  const lastBuildDate = new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(FEED_SELF_HTML)}</link>
    <description>${escapeXml(FEED_DESC)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(FEED_URL)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=300, s-maxage=300, stale-while-revalidate=900",
    },
  });
}
