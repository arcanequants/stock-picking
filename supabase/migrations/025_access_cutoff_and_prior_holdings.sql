-- 025_access_cutoff_and_prior_holdings.sql
-- Two related changes that ship together:
--
-- 1. subscribers.access_started_at — the moment a user gained access to
--    the app (paid checkout today, trial-start in the future). The iOS
--    picks tab shows the chronological feed from this date forward only,
--    so newcomers don't see 70+ retroactive picks and feel they're
--    "behind". Historical picks live in a separate Archivo section
--    visible only to paying/trial users.
--    Backfilled from `created_at` for existing rows.
--
-- 2. prior_holdings — user-entered positions from before they joined
--    Vectorial. Limited to tickers that ARE Vectorial picks (validated
--    in the API against stocks.ts — canonical pick list lives in code).
--    Aggregated alongside `user_pick_status` (status='bought') rows in
--    `/api/portfolio/positions?view=personal` so the user's position
--    size + weighted avg buy price reflect their full real holdings.
--
--    Schema mirrors `user_pick_status` (buy_price + amount_invested)
--    so the aggregation in route.ts merges cleanly.

-- ---------- access_started_at on subscribers ----------

alter table public.subscribers
  add column if not exists access_started_at timestamptz;

-- Backfill: existing subscribers get their account-creation moment as
-- the access start. Idempotent — only fills nulls.
update public.subscribers
  set access_started_at = created_at
  where access_started_at is null;

create index if not exists subscribers_access_started_at_idx
  on public.subscribers (access_started_at);

-- ---------- prior_holdings ----------

create table if not exists public.prior_holdings (
  id              bigserial primary key,
  email           text not null,
  ticker          text not null,
  purchase_date   date not null,
  buy_price       numeric(14,4) not null check (buy_price > 0),
  amount_invested numeric(14,2) not null check (amount_invested > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists prior_holdings_email_idx
  on public.prior_holdings (email);

create index if not exists prior_holdings_email_ticker_idx
  on public.prior_holdings (email, ticker);

-- keep updated_at fresh
create or replace function public.prior_holdings_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists prior_holdings_updated_at on public.prior_holdings;
create trigger prior_holdings_updated_at
  before update on public.prior_holdings
  for each row execute function public.prior_holdings_set_updated_at();

-- RLS: service role only. iOS hits /api/prior-holdings endpoints.
alter table public.prior_holdings enable row level security;
revoke all on public.prior_holdings from anon, authenticated;
