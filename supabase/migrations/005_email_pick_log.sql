-- Email Pick Log — deduplication for premium email delivery
-- Prevents sending the same pick twice to the same subscriber.
-- Used by /api/cron/email-pick and /api/cron/email-pick/approve

CREATE TABLE IF NOT EXISTS email_pick_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pick_number INTEGER NOT NULL,
  user_email VARCHAR(320) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pick_number, user_email)
);

CREATE INDEX IF NOT EXISTS idx_email_pick_log_pick ON email_pick_log(pick_number);
CREATE INDEX IF NOT EXISTS idx_email_pick_log_email ON email_pick_log(user_email);

-- Email Apology Log — tracks one-time catch-up emails sent to users who missed picks
-- Prevents sending duplicate apology emails.

CREATE TABLE IF NOT EXISTS email_apology_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(320) NOT NULL UNIQUE,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_apology_log_email ON email_apology_log(user_email);

-- Ensure subscribers.delivery_channel exists with proper default
-- (safe no-op if already present from prior manual setup)
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS delivery_channel VARCHAR(20) DEFAULT 'whatsapp';

-- Backfill NULL values to 'whatsapp' so existing users appear in cron queries
UPDATE subscribers
SET delivery_channel = 'whatsapp'
WHERE delivery_channel IS NULL;
