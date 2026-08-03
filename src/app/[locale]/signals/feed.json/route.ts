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
const FEED_URL = `${SITE_URL}/signals/feed.json`;
const HOME_URL = `${SITE_URL}/signals`;

export const dynamic = "force-dynamic";
export const revalidate = 300;

function fmtValue(value: number, decimals: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function buildItem(def: SignalDefinition, obs: SignalObservation) {
  const casual = pickCopyCasual(def.copy, "en");
  const valueDisplay = `${fmtValue(Number(obs.value), def.display_decimals)} ${def.unit}`;
  const title = `${casual.title || def.name}: ${valueDisplay}`;
  const url = `${SITE_URL}/signals/${def.id}`;
  const summary = casual.translation || casual.tagline || def.name;
  return {
    id: `${url}#${obs.observed_at}`,
    url,
    title,
    content_text: summary,
    summary,
    date_published: new Date(obs.observed_at).toISOString(),
    tags: [def.domain, def.status],
    _vectorial: {
      signal_id: def.id,
      value: Number(obs.value),
      unit: def.unit,
      baseline_value: obs.baseline_value,
      z_score: obs.z_score,
      observed_at: obs.observed_at,
    },
  };
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
    .filter(Boolean);

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: FEED_TITLE,
    home_page_url: HOME_URL,
    feed_url: FEED_URL,
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
