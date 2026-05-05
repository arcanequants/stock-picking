-- DRIP support: per-position shares after dividend reinvestment.
-- The cron walks each tx's events (splits + dividends) chronologically and
-- writes the resulting share count keyed by `${ticker}|${date}|${type}`.
-- Runtime endpoints read this so per-position cards stay consistent with the
-- aggregate total_value (which already incorporates DRIP).

ALTER TABLE portfolio_snapshots
  ADD COLUMN IF NOT EXISTS position_shares JSONB DEFAULT '{}'::jsonb;
