-- Quant Lab — systematic bots tracked inside Vectorial Data.
-- First bot = Arcane Quant (Binance Futures Copy Trading).
-- We snapshot the public Binance copy-trade endpoints every 2h to build
-- our own time-series (equity curve, ROI history). Binance's public API
-- does not expose an equity-curve endpoint, so we grow one from snapshots.

CREATE TABLE IF NOT EXISTS quant_lab_bots (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  portfolio_id TEXT NOT NULL,
  lead_details_url TEXT NOT NULL,
  referral_url TEXT,
  asset_class TEXT NOT NULL,
  description TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quant_lab_bots_active
  ON quant_lab_bots(is_active) WHERE is_active = TRUE;

INSERT INTO quant_lab_bots (
  slug, name, exchange, portfolio_id, lead_details_url, referral_url,
  asset_class, description, started_at
) VALUES (
  'arcane-quant',
  'Arcane Quant',
  'binance-futures',
  '4601095566993486080',
  'https://www.binance.com/en/copy-trading/lead-details/4601095566993486080',
  NULL,
  'crypto-futures',
  'Systematic crypto-futures strategy on Binance.',
  '2026-03-23 00:00:00+00'
) ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS quant_lab_snapshots (
  id BIGSERIAL PRIMARY KEY,
  bot_id BIGINT NOT NULL REFERENCES quant_lab_bots(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_range TEXT NOT NULL,
  roi NUMERIC(12, 6),
  pnl NUMERIC(18, 6),
  mdd NUMERIC(12, 6),
  copier_pnl NUMERIC(18, 6),
  win_rate NUMERIC(8, 4),
  win_orders INTEGER,
  total_orders INTEGER,
  sharp_ratio NUMERIC(12, 6),
  aum_amount NUMERIC(18, 6),
  margin_balance NUMERIC(18, 6),
  current_copy_count INTEGER,
  max_copy_count INTEGER,
  total_copy_count INTEGER,
  rebate_fee NUMERIC(18, 6),
  raw_detail JSONB,
  raw_performance JSONB
);

CREATE INDEX IF NOT EXISTS idx_quant_lab_snapshots_bot_time
  ON quant_lab_snapshots(bot_id, time_range, captured_at DESC);

CREATE TABLE IF NOT EXISTS quant_lab_alert_subscribers (
  id BIGSERIAL PRIMARY KEY,
  bot_id BIGINT NOT NULL REFERENCES quant_lab_bots(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  source TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quant_lab_alerts_unique
  ON quant_lab_alert_subscribers(bot_id, email);
CREATE INDEX IF NOT EXISTS idx_quant_lab_alerts_active
  ON quant_lab_alert_subscribers(bot_id) WHERE unsubscribed_at IS NULL;
