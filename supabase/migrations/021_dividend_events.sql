-- 021_dividend_events.sql
-- Persist dividends paid to the Vectorial Data MODEL portfolio (not personal).
-- Decided 2026-05-18 with Alberto. We can't know when each subscriber bought,
-- so we surface "el portafolio Vectorial recibió un dividendo" as transparency,
-- not as personal-income notifications. Web + iOS only, no WhatsApp.

create table if not exists public.dividend_events (
  id                    uuid primary key default gen_random_uuid(),
  ticker                text not null,
  ex_date               date not null,
  pay_date              date,
  amount_per_share      numeric(10,4) not null check (amount_per_share > 0),
  shares_held           numeric(20,8) not null check (shares_held >= 0),
  total_amount          numeric(14,4) not null check (total_amount >= 0),
  position_pct_impact   numeric(8,4),
  created_at            timestamptz not null default now(),
  unique (ticker, ex_date)
);

create index if not exists dividend_events_ticker_pay_date_idx
  on public.dividend_events (ticker, pay_date desc nulls last);

create index if not exists dividend_events_ex_date_idx
  on public.dividend_events (ex_date desc);

-- RLS: public read (model-portfolio data is public), service-role write only.
alter table public.dividend_events enable row level security;

drop policy if exists dividend_events_public_read on public.dividend_events;
create policy dividend_events_public_read
  on public.dividend_events
  for select
  using (true);

revoke insert, update, delete on public.dividend_events from anon, authenticated;
