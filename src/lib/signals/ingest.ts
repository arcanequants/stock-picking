import { getSupabaseAdmin } from "@/lib/supabase";

export type IngestResult =
  | { signal_id: string; status: "ok"; observed_at: string; value: number }
  | { signal_id: string; status: "skipped"; reason: string }
  | { signal_id: string; status: "missing_keys"; missing: string[] }
  | { signal_id: string; status: "error"; error: string };

export type ObservationInput = {
  signal_id: string;
  observed_at: string;
  value: number;
  uncertainty_lo?: number | null;
  uncertainty_hi?: number | null;
  baseline_value?: number | null;
  z_score?: number | null;
  metadata?: Record<string, unknown> | null;
  raw_payload?: unknown;
};

export async function upsertObservation(obs: ObservationInput): Promise<IngestResult> {
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("signal_observations").upsert(
      {
        signal_id: obs.signal_id,
        observed_at: obs.observed_at,
        value: obs.value,
        uncertainty_lo: obs.uncertainty_lo ?? null,
        uncertainty_hi: obs.uncertainty_hi ?? null,
        baseline_value: obs.baseline_value ?? null,
        z_score: obs.z_score ?? null,
        metadata: obs.metadata ?? null,
        raw_payload: obs.raw_payload ?? null,
      },
      { onConflict: "signal_id,observed_at" }
    );
    if (error) {
      return { signal_id: obs.signal_id, status: "error", error: error.message };
    }
    return {
      signal_id: obs.signal_id,
      status: "ok",
      observed_at: obs.observed_at,
      value: obs.value,
    };
  } catch (err) {
    return {
      signal_id: obs.signal_id,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function missingKeys(
  signal_id: string,
  required: { name: string; value: string | undefined }[]
): IngestResult | null {
  const missing = required.filter((r) => !r.value).map((r) => r.name);
  if (missing.length === 0) return null;
  return { signal_id, status: "missing_keys", missing };
}
