-- Support ticket thread messages (V2 of support).
-- V1 (007) stored only the original ticket. V2 adds bidirectional replies
-- between user and admin, both via the in-app inbox at /admin/tickets and
-- /account/tickets. Email is just notification — the actual thread lives here.

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_email TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket
  ON support_ticket_messages(ticket_id, created_at);

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- App accesses via service-role (getSupabaseAdmin), so RLS deny-all is fine.
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Backfill: every existing ticket gets its original message as the first
-- thread entry so the UI has something to show.
INSERT INTO support_ticket_messages (ticket_id, sender_type, sender_email, body, created_at)
SELECT id, 'user', email, message, created_at
FROM support_tickets
WHERE NOT EXISTS (
  SELECT 1 FROM support_ticket_messages m WHERE m.ticket_id = support_tickets.id
);
