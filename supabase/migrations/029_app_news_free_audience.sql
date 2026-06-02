-- 029_app_news_free_audience.sql
-- Add a third audience value 'free' to app_news so Alberto can publish a
-- news item that reaches ONLY non-paying (free) users — e.g. an upsell nudge
-- to convert. Tier stays automatic/Stripe-derived: premium = active|trialing
-- subscriber, free = everyone else. No manual tier table.
--
--   audience = 'all'     → everyone
--   audience = 'premium' → only active/trialing subscribers
--   audience = 'free'    → only non-subscribers (NOT active/trialing)

alter table public.app_news
  drop constraint if exists app_news_audience_check;

alter table public.app_news
  add constraint app_news_audience_check
  check (audience in ('all', 'premium', 'free'));
