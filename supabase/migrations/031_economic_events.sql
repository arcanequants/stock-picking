-- Economic Calendar — one daily analysis of the single most relevant macro event.
-- Dual surface: human (/economia) + machine (brief.md, feeds, /api/v1).
-- Written by a claude.ai daily routine via POST /api/economic-events/ingest.

CREATE TABLE IF NOT EXISTS economic_events (
  id BIGSERIAL PRIMARY KEY,
  -- One analysis per calendar day. The routine no-ops on days with no relevant event.
  event_date DATE NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  country TEXT NOT NULL,
  category TEXT NOT NULL,
  importance TEXT NOT NULL DEFAULT 'high' CHECK (importance IN ('high','medium')),
  -- Released figures kept as text to preserve units/symbols ("3.5%", "250K", "-0.2%").
  actual TEXT,
  forecast TEXT,
  previous TEXT,
  unit TEXT,
  surprise TEXT CHECK (surprise IN ('hotter','cooler','inline','mixed')),
  -- [{ market, direction: up|down|neutral, why }]
  affected_markets JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- { es:{headline,what_it_means,market_impact,learning}, en:{...}, pt:{...} }
  analysis JSONB NOT NULL,
  source_url TEXT,
  -- When the data was released vs when we ingested it (point-in-time discipline).
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_economic_events_date
  ON economic_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_economic_events_published
  ON economic_events(published_at DESC);

-- Public read; writes only via service role (ingest endpoint bypasses RLS).
ALTER TABLE public.economic_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "economic_events_public_read"
  ON public.economic_events FOR SELECT
  TO anon, authenticated
  USING (true);
