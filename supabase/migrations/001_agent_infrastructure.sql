-- Agent Infrastructure: API keys + Crypto payments
-- Run via Supabase SQL Editor

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(200),
  tier VARCHAR(20) NOT NULL DEFAULT 'free',
  wallet_address VARCHAR(42),
  email VARCHAR(320),
  requests_today INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 10,
  last_request_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_email ON api_keys(email);

CREATE TABLE IF NOT EXISTS crypto_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash VARCHAR(66) NOT NULL UNIQUE,
  from_address VARCHAR(42) NOT NULL,
  amount DECIMAL(20,6) NOT NULL,
  chain VARCHAR(20) DEFAULT 'base',
  api_key_id UUID REFERENCES api_keys(id),
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crypto_payments_tx_hash ON crypto_payments(tx_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_api_key ON crypto_payments(api_key_id);

-- Atomic increment for rate limiting
CREATE OR REPLACE FUNCTION increment_api_usage(key_id UUID)
RETURNS void AS $$
  UPDATE api_keys
  SET requests_today = requests_today + 1,
      last_request_at = NOW()
  WHERE id = key_id;
$$ LANGUAGE sql;
