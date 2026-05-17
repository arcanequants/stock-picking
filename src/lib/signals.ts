import { getSupabaseAdmin } from "@/lib/supabase";

export type SignalDomain =
  | "maritime"
  | "energy"
  | "geospatial"
  | "atmospheric"
  | "agricultural"
  | "cross";

export type SignalStatus = "live" | "decayed" | "deprecated";

export type SignalLocale = "es" | "en" | "pt" | "hi";

export type SignalCopyTier = {
  title: string;
  tagline: string;
  translation: string;
  alert: string;
};

export type SignalCopyPro = {
  one_liner: string;
};

export type SignalCopy = {
  casual: Partial<Record<SignalLocale, SignalCopyTier>>;
  pro: Partial<Record<SignalLocale, SignalCopyPro>>;
};

export type SignalMethodology = {
  source: string;
  baseline_method: string;
  cadence: string;
  sensors_or_apis: string[];
  geo_aoi?: string;
  uncertainty_note?: string;
  known_biases?: string[];
};

export type SignalBacktest = {
  walk_forward_window: string;
  ic: number;
  sample_quarters?: number;
  capacity_estimate_usd?: number;
  t_cost_bps?: number;
  notes?: string;
};

export type SignalDefinition = {
  id: string;
  domain: SignalDomain;
  name: string;
  unit: string;
  display_decimals: number;
  copy: SignalCopy;
  methodology: SignalMethodology;
  backtest: SignalBacktest | null;
  status: SignalStatus;
  source_url: string;
  license: string;
  created_at: string;
  updated_at: string;
};

export type SignalObservation = {
  id: number;
  signal_id: string;
  observed_at: string;
  ingested_at: string;
  value: number;
  uncertainty_lo: number | null;
  uncertainty_hi: number | null;
  baseline_value: number | null;
  z_score: number | null;
  metadata: Record<string, unknown> | null;
};

export type SignalView = "casual" | "pro";

export const SIGNAL_VIEW_COOKIE = "signals_view";

export function pickCopyCasual(
  copy: SignalCopy,
  locale: SignalLocale
): SignalCopyTier {
  return (
    copy.casual[locale] ??
    copy.casual.es ??
    copy.casual.en ??
    { title: "", tagline: "", translation: "", alert: "" }
  );
}

export function pickCopyPro(
  copy: SignalCopy,
  locale: SignalLocale
): SignalCopyPro {
  return (
    copy.pro[locale] ??
    copy.pro.es ??
    copy.pro.en ??
    { one_liner: "" }
  );
}

export async function listLiveSignals(): Promise<SignalDefinition[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("signal_definitions")
    .select("*")
    .eq("status", "live")
    .order("domain", { ascending: true })
    .order("id", { ascending: true });
  return (data ?? []) as SignalDefinition[];
}

export async function getSignal(id: string): Promise<SignalDefinition | null> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("signal_definitions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as SignalDefinition | null) ?? null;
}

export async function getRecentObservations(
  signalId: string,
  windowDays = 90
): Promise<SignalObservation[]> {
  const sb = getSupabaseAdmin();
  const since = new Date(Date.now() - windowDays * 86400_000).toISOString();
  const { data } = await sb
    .from("signal_observations")
    .select("*")
    .eq("signal_id", signalId)
    .gte("observed_at", since)
    .order("observed_at", { ascending: true });
  return (data ?? []) as SignalObservation[];
}

export async function listRecentObservationsAcrossSignals(
  limit = 50
): Promise<SignalObservation[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("signal_observations")
    .select("*")
    .order("observed_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as SignalObservation[];
}

export type WeeklySignalSnapshot = {
  definition: SignalDefinition;
  latest: SignalObservation;
  earliest: SignalObservation;
  delta7d_pct: number | null;
};

/**
 * Per-signal week-over-week snapshot — used by the Sunday digest "Esta semana
 * en Signals" section. Returns one row per live signal sorted by |Δ7d| desc so
 * the most interesting movers surface first.
 */
export async function getWeeklySignalsSummary(): Promise<WeeklySignalSnapshot[]> {
  const defs = await listLiveSignals();
  const sb = getSupabaseAdmin();
  const since = new Date(Date.now() - 8 * 86400_000).toISOString();

  const rows = await Promise.all(
    defs.map(async (def) => {
      const { data } = await sb
        .from("signal_observations")
        .select("*")
        .eq("signal_id", def.id)
        .gte("observed_at", since)
        .order("observed_at", { ascending: false });
      const obs = (data ?? []) as SignalObservation[];
      if (obs.length === 0) return null;
      const latest = obs[0];
      const earliest = obs[obs.length - 1];
      const earliestVal = Number(earliest.value);
      const delta =
        obs.length >= 2 && earliestVal !== 0
          ? (Number(latest.value) - earliestVal) / Math.abs(earliestVal)
          : null;
      return {
        definition: def,
        latest,
        earliest,
        delta7d_pct: delta,
      } satisfies WeeklySignalSnapshot;
    })
  );

  return rows
    .filter((r): r is WeeklySignalSnapshot => r !== null)
    .sort(
      (a, b) => Math.abs(b.delta7d_pct ?? 0) - Math.abs(a.delta7d_pct ?? 0)
    );
}

export async function getLatestObservation(
  signalId: string
): Promise<SignalObservation | null> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("signal_observations")
    .select("*")
    .eq("signal_id", signalId)
    .order("observed_at", { ascending: false })
    .limit(1);
  const row = data?.[0];
  return (row as SignalObservation | undefined) ?? null;
}

export type SignalSnapshot = {
  definition: SignalDefinition;
  latest: SignalObservation | null;
  history90d: SignalObservation[];
  delta_vs_baseline_pct: number | null;
};

export async function getSignalSnapshot(
  id: string
): Promise<SignalSnapshot | null> {
  const definition = await getSignal(id);
  if (!definition) return null;
  const [latest, history90d] = await Promise.all([
    getLatestObservation(id),
    getRecentObservations(id, 90),
  ]);
  const delta =
    latest && latest.baseline_value !== null && latest.baseline_value !== 0
      ? (Number(latest.value) - Number(latest.baseline_value)) /
        Math.abs(Number(latest.baseline_value))
      : null;
  return { definition, latest, history90d, delta_vs_baseline_pct: delta };
}

const DISCLAIMER_ES =
  "Vectorial Signals es inteligencia descriptiva de mercado. No es asesoría de inversiones. Las correlaciones históricas no garantizan resultados futuros.";

const DISCLAIMER_EN =
  "Vectorial Signals is descriptive market intelligence. Not investment advice. Past correlations don't predict future performance.";

function fmtValue(value: number, decimals: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${(pct * 100).toFixed(1)}%`;
}

export function renderBriefMarkdown(
  snapshot: SignalSnapshot,
  locale: SignalLocale
): string {
  const { definition, latest, delta_vs_baseline_pct } = snapshot;
  const casual = pickCopyCasual(definition.copy, locale);
  const m = definition.methodology;
  const disclaimer = locale === "en" ? DISCLAIMER_EN : DISCLAIMER_ES;

  const observation = latest
    ? `${fmtValue(Number(latest.value), definition.display_decimals)} ${definition.unit}`
    : "(no observation yet)";

  const baseline = latest?.baseline_value
    ? `${fmtValue(Number(latest.baseline_value), definition.display_decimals)} ${definition.unit} (${m.baseline_method})`
    : `(${m.baseline_method})`;

  const delta =
    delta_vs_baseline_pct !== null ? fmtPct(delta_vs_baseline_pct) : "n/a";

  const uncertainty =
    latest?.uncertainty_lo != null && latest?.uncertainty_hi != null
      ? `${fmtValue(Number(latest.uncertainty_lo), definition.display_decimals)} – ${fmtValue(Number(latest.uncertainty_hi), definition.display_decimals)} ${definition.unit}`
      : (m.uncertainty_note ?? "n/a");

  const observedAt = latest?.observed_at ?? "n/a";

  return `# ${definition.name}

> ${casual.tagline}

## OBSERVATION
${observation} — observed at ${observedAt}.

## DELTA VS BASELINE
${delta} vs ${baseline}.

## METHODOLOGY
- Source: ${m.source}
- Cadence: ${m.cadence}
- Sensors / APIs: ${m.sensors_or_apis.join(", ")}${m.geo_aoi ? `\n- AOI: ${m.geo_aoi}` : ""}
- Baseline method: ${m.baseline_method}

## UNCERTAINTY
${uncertainty}${m.uncertainty_note ? ` (${m.uncertainty_note})` : ""}

## PROVENANCE
- Source URL: ${definition.source_url}
- License: ${definition.license}
${definition.backtest ? `- Backtest IC: ${definition.backtest.ic.toFixed(2)} over ${definition.backtest.walk_forward_window}` : ""}

## TRANSLATION (Casual ${locale.toUpperCase()})
${casual.translation}

## DISCLAIMER
${disclaimer}
`;
}

export function renderMachineJson(snapshot: SignalSnapshot) {
  const { definition, latest, delta_vs_baseline_pct } = snapshot;
  return {
    id: definition.id,
    name: definition.name,
    domain: definition.domain,
    unit: definition.unit,
    status: definition.status,
    observed_at: latest?.observed_at ?? null,
    ingested_at: latest?.ingested_at ?? null,
    value: latest?.value ?? null,
    uncertainty_lo: latest?.uncertainty_lo ?? null,
    uncertainty_hi: latest?.uncertainty_hi ?? null,
    baseline_value: latest?.baseline_value ?? null,
    baseline_method: definition.methodology.baseline_method,
    delta_vs_baseline_pct,
    z_score: latest?.z_score ?? null,
    backtest: definition.backtest,
    source_url: definition.source_url,
    license: definition.license,
    brief_url: `https://vectorialdata.com/signals/${definition.id}/brief.md`,
    page_url: `https://vectorialdata.com/signals/${definition.id}`,
  };
}

export function renderJsonLdDataset(snapshot: SignalSnapshot, locale: SignalLocale) {
  const { definition } = snapshot;
  const casual = pickCopyCasual(definition.copy, locale);
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: definition.name,
    description: casual.tagline,
    creator: {
      "@type": "Organization",
      name: "Vectorial Data",
      url: "https://vectorialdata.com",
    },
    license: definition.license,
    measurementTechnique: definition.methodology.sensors_or_apis.join(", "),
    variableMeasured: `${definition.name} (${definition.unit})`,
    isAccessibleForFree: true,
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `https://vectorialdata.com/api/signals/${definition.id}`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/markdown",
        contentUrl: `https://vectorialdata.com/signals/${definition.id}/brief.md`,
      },
    ],
  };
}
