-- Event curation: separate signal from noise.
-- Humans see severity ≥ 4 only. AI/API gets the firehose.
--
-- severity:
--   5 = changes the thesis (cycle revisit, sell, lessons page material)
--   4 = important, no plan change (earnings beat with guidance, dividend cut,
--       major analyst sweep, regulatory shock)
--   3 = notable (regular earnings, regular dividend, near earnings date)
--   2 = noise (sub-5% price move, near 52w high, lone analyst upgrade)
--   1 = skip from human view
--
-- human_summary_*: ONE sentence in plain Spanish (≤25 words), no jargon.
-- Replaces the prior "what it means" + "for your portfolio" double section.
-- The latter framing also reads as personalized advice — we're a publisher,
-- not an advisor, so we drop it.
--
-- affects_thesis: explicit yes/no — does this event make us reconsider
-- holding the position? Used by the curated feed and the weekly digest.

ALTER TABLE portfolio_events
  ADD COLUMN IF NOT EXISTS severity SMALLINT NOT NULL DEFAULT 3
    CHECK (severity BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS affects_thesis BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS human_summary_es TEXT,
  ADD COLUMN IF NOT EXISTS human_summary_en TEXT,
  ADD COLUMN IF NOT EXISTS human_summary_pt TEXT,
  ADD COLUMN IF NOT EXISTS human_summary_hi TEXT;

CREATE INDEX IF NOT EXISTS idx_portfolio_events_severity_created
  ON portfolio_events (severity DESC, created_at DESC);
