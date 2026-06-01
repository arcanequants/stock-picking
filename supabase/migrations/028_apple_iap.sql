-- 028_apple_iap.sql
-- Apple In-App Purchase support on the existing subscribers table.
--
-- The iOS app sells the same monthly subscription via StoreKit (IAP) in
-- markets where Apple requires it (Mexico/LATAM/most of the world). To avoid
-- forking the access model, Apple subscriptions reuse the SAME source of
-- truth every endpoint already reads: subscribers.subscription_status
-- ('active' | 'trialing' | 'past_due' | 'canceled') and current_period_end.
--
-- New columns just record provenance + the Apple identifier the server-to-
-- server webhook (App Store Server Notifications V2) uses to find the row:
--   - subscription_source: 'stripe' (default) | 'apple'
--   - apple_original_transaction_id: stable ID across renewals; webhook key
--   - apple_product_id: the purchased subscription product id
--
-- A subscriber is keyed by email everywhere. The verify endpoint maps the
-- authenticated user's email to the Apple transaction at purchase time; the
-- webhook then updates by apple_original_transaction_id on renew/expire.

alter table public.subscribers
  add column if not exists subscription_source text not null default 'stripe',
  add column if not exists apple_original_transaction_id text,
  add column if not exists apple_product_id text;

-- Webhook lookups hit this on every Apple notification. Unique so two rows
-- can never claim the same Apple subscription. Partial: only Apple rows.
create unique index if not exists subscribers_apple_original_tx_idx
  on public.subscribers (apple_original_transaction_id)
  where apple_original_transaction_id is not null;
