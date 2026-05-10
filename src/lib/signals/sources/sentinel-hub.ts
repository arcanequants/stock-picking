import { missingKeys, type IngestResult } from "../ingest";

// ─────────────────────────────────────────────────────────
// TROPOMI NO₂ economic-activity index.
// Skeleton: Sentinel Hub Statistical API requires OAuth client credentials and
// AOI GeoJSON polygons (20 industrial regions per plan §4 Atmospheric). The
// AOI catalog is not yet committed — see PHASE 1 TODO in plan §6 ("scale to 50
// in Phase 2; Phase 1 ships top 20").
// ─────────────────────────────────────────────────────────
export async function ingestTropomiNo2(): Promise<IngestResult> {
  const signal_id = "tropomi-no2-economic";
  const miss = missingKeys(signal_id, [
    { name: "SENTINEL_HUB_CLIENT_ID", value: process.env.SENTINEL_HUB_CLIENT_ID },
    {
      name: "SENTINEL_HUB_CLIENT_SECRET",
      value: process.env.SENTINEL_HUB_CLIENT_SECRET,
    },
  ]);
  if (miss) return miss;

  return {
    signal_id,
    status: "skipped",
    reason:
      "Sentinel Hub credentials present but ingestor not yet implemented — pending AOI GeoJSON catalog (data/signals/aoi/no2-industrial.geojson).",
  };
}

// ─────────────────────────────────────────────────────────
// Iowa corn yield model.
// Skeleton: needs Sentinel-2 NDVI (Sentinel Hub), SMAP soil moisture (NASA
// Earthdata), CHIRPS rainfall (no auth, public THREDDS), USDA NASS CDL mask.
// CHIRPS could be wired today but the ensemble math needs the full input set.
// ─────────────────────────────────────────────────────────
export async function ingestIowaCornYield(): Promise<IngestResult> {
  const signal_id = "iowa-corn-yield";
  const miss = missingKeys(signal_id, [
    { name: "SENTINEL_HUB_CLIENT_ID", value: process.env.SENTINEL_HUB_CLIENT_ID },
    {
      name: "SENTINEL_HUB_CLIENT_SECRET",
      value: process.env.SENTINEL_HUB_CLIENT_SECRET,
    },
    { name: "NASA_EARTHDATA_TOKEN", value: process.env.NASA_EARTHDATA_TOKEN },
  ]);
  if (miss) return miss;

  return {
    signal_id,
    status: "skipped",
    reason:
      "All keys present but phenology-weighted ensemble not yet implemented — pending NDVI/SMAP/CHIRPS join + USDA CDL Iowa mask wiring.",
  };
}
