-- WhatsApp group join tracking + follow-up state.
-- wa_click_at     : set when subscriber clicks the tracked WA group link
-- wa_followup_sent_at : set when the 48h reminder email has been sent
--                       (prevents double-sends if the cron fires repeatedly)

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS wa_click_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wa_followup_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_subscribers_wa_followup_eligible
  ON subscribers (created_at)
  WHERE wa_click_at IS NULL AND wa_followup_sent_at IS NULL;
