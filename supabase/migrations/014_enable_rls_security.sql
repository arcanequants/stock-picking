-- Enable Row Level Security on tables exposed via PostgREST.
-- All app code accesses these tables via service-role key (getSupabaseAdmin),
-- which bypasses RLS. So enabling RLS with no policies = deny-all for anon/
-- authenticated, no impact on app behavior.
--
-- Fixes Supabase database linter errors:
--   - rls_disabled_in_public (7 tables)
--   - sensitive_columns_exposed (device_tokens.token)

ALTER TABLE public.email_apology_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_pick_preview_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_lab_bots              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_lab_snapshots         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_lab_alert_subscribers ENABLE ROW LEVEL SECURITY;
