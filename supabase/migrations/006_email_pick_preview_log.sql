-- Email Pick Preview Log — dedup admin preview emails across Vercel deploys
-- A Vercel deploy webhook fires on every production deploy. We only want to send
-- the admin approval preview ONCE per pick_number, not on every redeploy.

CREATE TABLE IF NOT EXISTS email_pick_preview_log (
  pick_number INTEGER PRIMARY KEY,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
