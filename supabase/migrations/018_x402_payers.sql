-- 018_x402_payers.sql
-- Track unique x402 payers (EVM wallet addresses paying for our API endpoints).
-- Used to alert Alberto only on the FIRST payment per wallet (not every $0.002 request)
-- and to power the weekly subscriber briefing's "crypto payers" section.

create table if not exists public.x402_payers (
  wallet            text         primary key,
  first_payment_at  timestamptz  not null default now(),
  last_payment_at   timestamptz  not null default now(),
  network           text         not null,
  request_count     integer      not null default 1,
  total_paid_usd    numeric(18,8) not null default 0,
  last_endpoint     text,
  alerted_at        timestamptz
);

create index if not exists x402_payers_first_payment_at_idx
  on public.x402_payers (first_payment_at desc);

create index if not exists x402_payers_last_payment_at_idx
  on public.x402_payers (last_payment_at desc);

alter table public.x402_payers enable row level security;

-- Service-role only. No public read/write; cron + handler use service role.
revoke all on public.x402_payers from anon, authenticated;
