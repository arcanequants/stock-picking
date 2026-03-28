-- Marketing dashboard: passkey auth + analytics data
-- Run via Supabase SQL Editor

-- 1. Admin users for passkey auth (separate from product auth)
CREATE TABLE IF NOT EXISTS marketing_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Passkey credentials (one admin can have multiple passkeys)
CREATE TABLE IF NOT EXISTS marketing_passkeys (
  id TEXT NOT NULL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES marketing_admins(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type VARCHAR(20),
  backed_up BOOLEAN DEFAULT false,
  transports TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_passkeys_admin_id ON marketing_passkeys(admin_id);

-- 3. WebAuthn challenge store (short-lived)
CREATE TABLE IF NOT EXISTS marketing_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge TEXT NOT NULL,
  admin_id UUID REFERENCES marketing_admins(id),
  type VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes')
);

CREATE INDEX IF NOT EXISTS idx_challenges_expires ON marketing_challenges(expires_at);

-- 4. Marketing sessions (HTTP-only cookie sessions)
CREATE TABLE IF NOT EXISTS marketing_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES marketing_admins(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON marketing_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON marketing_sessions(expires_at);

-- 5. Weekly marketing analytics
CREATE TABLE IF NOT EXISTS marketing_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  platform VARCHAR(30) NOT NULL,
  followers INTEGER DEFAULT 0,
  followers_gained INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  top_post_url TEXT,
  top_post_impressions INTEGER DEFAULT 0,
  extra JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_start, platform)
);

CREATE INDEX IF NOT EXISTS idx_analytics_week ON marketing_analytics(week_start DESC);

-- 6. Marketing budget tracking
CREATE TABLE IF NOT EXISTS marketing_budget (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  planned DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, category)
);

-- 7. Strategy notes
CREATE TABLE IF NOT EXISTS marketing_strategy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_week ON marketing_strategy(week_start DESC);

-- Cleanup function for expired challenges and sessions
CREATE OR REPLACE FUNCTION cleanup_marketing_expired()
RETURNS void AS $$
  DELETE FROM marketing_challenges WHERE expires_at < NOW();
  DELETE FROM marketing_sessions WHERE expires_at < NOW();
$$ LANGUAGE sql;

-- Seed admin (run manually after migration)
-- INSERT INTO marketing_admins (username, display_name) VALUES ('alberto', 'Alberto Sorno');
