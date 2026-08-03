import { listEvents, pickAnalysis } from "@/lib/economic-events";

const SITE_URL = "https://vectorialdata.com";
const FEED_TITLE = "Vectorial Economía";
const FEED_DESC =
  "The single most relevant macro event of the day, explained simply with a takeaway. Educational, not investment advice.";

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

export async function GET() {
  const events = await listEvents(50);

  const items = events
    .map((ev) => {
      const en = pickAnalysis(ev, "en");
      const link = `${SITE_URL}/economia/${ev.slug}`;
      const title = `${ev.event_name}: ${ev.actual ?? "—"}${ev.unit ? ` ${ev.unit}` : ""}`;
      const pubDate = new Date(ev.published_at).toUTCString();
      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(en.headline)}</description>
      <category>${escapeXml(ev.category)}</category>
    </item>`;
    })
    .join("\n");

  const lastBuildDate = new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(`${SITE_URL}/economia`)}</link>
    <description>${escapeXml(FEED_DESC)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(`${SITE_URL}/economia/feed.xml`)}" rel="self" type="application/rss+xml" />
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
