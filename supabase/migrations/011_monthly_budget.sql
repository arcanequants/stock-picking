-- DCA monthly budget per subscriber.
-- Stored in USD. Divided by 30 at display time = per-pick amount.
-- NULL = subscriber hasn't set a budget yet.
-- budget_reminder_sent_at: set when the 3-day "you didn't set your rule"
-- follow-up email has been sent (prevents double-sends).

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS monthly_budget_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS budget_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_subscribers_budget_reminder_eligible
  ON subscribers (created_at)
  WHERE monthly_budget IS NULL AND budget_reminder_sent_at IS NULL;
