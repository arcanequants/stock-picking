-- 024_user_dividend_events.sql
-- Per-user dividend ledger. Decided 2026-05-21 with Alberto.
--
-- The unlock: now that user_pick_status tracks (email, ticker, buy_price,
-- amount_invested, decided_at), we can finally attribute each dividend event
-- back to specific subscribers — not just "el portafolio recibió" framing.
--
-- V1 design choices (kept simple on purpose):
--   * Shares snapshot = amount_invested / buy_price, frozen at buy time.
--     No DRIP, no split handling. Splits/DRIP rare enough to fix manually if
--     they hit.
--   * One row per (user, ticker, ex_date). Fanned out by the dividend-scanner
--     cron immediately after it inserts the model row.
--   * notified_at IS NULL = push pending. Cron flips it once APN succeeds.

create table if not exists public.user_dividend_events (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null,
  ticker              text not null,
  pick_number         integer not null,
  ex_date             date not null,
  pay_date            date,
  amount_per_share    numeric(10,4) not null check (amount_per_share > 0),
  shares_held         numeric(20,8) not null check (shares_held > 0),
  total_amount        numeric(14,4) not null check (total_amount > 0),
  -- Snapshot of the basis at fanout time, so dividend history stays correct
  -- even if the user later edits buy_price/amount_invested on user_pick_status.
  buy_price           numeric(14,4) not null,
  amount_invested    numeric(14,2) not null,
  notified_at         timestamptz,
  created_at          timestamptz not null default now(),
  unique (email, ticker, ex_date)
);

create index if not exists user_dividend_events_email_paydate_idx
  on public.user_dividend_events (email, pay_date desc nulls last, ex_date desc);

create index if not exists user_dividend_events_email_ticker_idx
  on public.user_dividend_events (email, ticker, ex_date desc);

create index if not exists user_dividend_events_pending_notif_idx
  on public.user_dividend_events (created_at)
  where notified_at is null;

-- RLS: service role only. iOS reaches this via /api/portfolio/dividends.
alter table public.user_dividend_events enable row level security;
revoke all on public.user_dividend_events from anon, authenticated;
