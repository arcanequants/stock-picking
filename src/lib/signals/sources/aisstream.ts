import { missingKeys, type IngestResult } from "../ingest";

// ─────────────────────────────────────────────────────────
// Hormuz Strait transit count.
// Skeleton: AISStream is a persistent WebSocket; Vercel Functions can't hold
// long-lived connections. Plan §4 Maritime: Phase 1 = sample-only via Vercel
// cron hitting an AIS snapshot endpoint, Phase 2 = Fly.io worker.
//
// This stub returns missing_keys until AISSTREAM_API_KEY is provisioned; once
// it lands, replace this with a 60s WebSocket capture inside the cron window
// (or migrate to a Fly.io worker per the plan).
// ─────────────────────────────────────────────────────────
export async function ingestHormuzTransit(): Promise<IngestResult> {
  const signal_id = "hormuz-transit";
  const miss = missingKeys(signal_id, [
    { name: "AISSTREAM_API_KEY", value: process.env.AISSTREAM_API_KEY },
  ]);
  if (miss) return miss;

  return {
    signal_id,
    status: "skipped",
    reason:
      "AISSTREAM_API_KEY present but ingestor not yet implemented — see Phase 1 architecture note in VECTORIAL_SIGNALS_PLAN.md §4 Maritime.",
  };
}
