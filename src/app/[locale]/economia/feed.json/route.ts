import { listEvents, pickAnalysis } from "@/lib/economic-events";

const SITE_URL = "https://vectorialdata.com";
const FEED_TITLE = "Vectorial Economía";
const FEED_DESC =
  "The single most relevant macro event of the day, explained simply with a takeaway — and structured for bots. Educational, not investment advice.";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  const events = await listEvents(50);

  const items = events.map((ev) => {
    const en = pickAnalysis(ev, "en");
    const url = `${SITE_URL}/economia/${ev.slug}`;
    return {
      id: url,
      url,
      title: `${ev.event_name}: ${ev.actual ?? "—"}${ev.unit ? ` ${ev.unit}` : ""}`,
      content_text: en.what_it_means,
      summary: en.headline,
      date_published: new Date(ev.published_at).toISOString(),
      tags: [ev.country, ev.category, ev.importance],
      _vectorial: {
        event: ev.event_name,
        country: ev.country,
        category: ev.category,
        actual: ev.actual,
        forecast: ev.forecast,
        previous: ev.previous,
        unit: ev.unit,
        surprise: ev.surprise,
        affected_markets: ev.affected_markets,
        learning: en.learning,
        occurred_at: ev.occurred_at,
      },
    };
  });

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: FEED_TITLE,
    home_page_url: `${SITE_URL}/economia`,
    feed_url: `${SITE_URL}/economia/feed.json`,
    description: FEED_DESC,
    language: "en",
    icon: `${SITE_URL}/icon.png`,
    favicon: `${SITE_URL}/favicon.ico`,
    authors: [{ name: "Vectorial Data", url: SITE_URL }],
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control":
        "public, max-age=300, s-maxage=300, stale-while-revalidate=900",
    },
  });
}
