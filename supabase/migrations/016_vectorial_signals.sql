-- Vectorial Signals — submarca alt-data foundation.
-- Phase 1 of VECTORIAL_SIGNALS_PLAN.md. Three tables (definitions, observations,
-- IC history), point-in-time-safe writes, RLS deny-all (app reads via service-role).

CREATE TABLE IF NOT EXISTS signal_definitions (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL CHECK (domain IN ('maritime','energy','geospatial','atmospheric','agricultural','cross')),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  display_decimals INT NOT NULL DEFAULT 2,
  copy JSONB NOT NULL,
  methodology JSONB NOT NULL,
  backtest JSONB,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live','decayed','deprecated')),
  source_url TEXT NOT NULL,
  license TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_definitions_status_domain
  ON signal_definitions(status, domain);

-- Point-in-time-safe: observed_at is when the underlying data was acquired,
-- ingested_at is when WE got it. UNIQUE (signal_id, observed_at) blocks
-- accidental duplicate writes; updates require an explicit DELETE + INSERT
-- (no UPDATE policy by default).
CREATE TABLE IF NOT EXISTS signal_observations (
  id BIGSERIAL PRIMARY KEY,
  signal_id TEXT NOT NULL REFERENCES signal_definitions(id) ON DELETE CASCADE,
  observed_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  value NUMERIC NOT NULL,
  uncertainty_lo NUMERIC,
  uncertainty_hi NUMERIC,
  baseline_value NUMERIC,
  z_score NUMERIC,
  metadata JSONB,
  raw_payload JSONB,
  UNIQUE (signal_id, observed_at)
);

CREATE INDEX IF NOT EXISTS idx_signal_observations_signal_time
  ON signal_observations(signal_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS signal_ic_history (
  signal_id TEXT NOT NULL REFERENCES signal_definitions(id) ON DELETE CASCADE,
  evaluated_at TIMESTAMPTZ NOT NULL,
  rolling_ic_252d NUMERIC NOT NULL,
  sample_size INT NOT NULL,
  PRIMARY KEY (signal_id, evaluated_at)
);

ALTER TABLE public.signal_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_ic_history ENABLE ROW LEVEL SECURITY;
