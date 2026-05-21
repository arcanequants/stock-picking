-- 023_user_pick_status.sql
-- Per-user pick decisions: bought / skipped / pending.
-- Decided 2026-05-20 with Alberto. Picks live in code (stocks.ts) so we key by
-- pick_number (stable int). Default 'pending' is IMPLICIT — we only insert a
-- row when the user takes an action. Anything not in this table is pending.
--
-- Also adds subscribers.default_investment for the "Mi Portfolio" math
-- (frictionless mini-sheet that pre-fills monto by pick).

create table if not exists public.user_pick_status (
  id              bigserial primary key,
  email           text not null,
  pick_number     integer not null,
  ticker          text not null,
  status          text not null check (status in ('bought', 'skipped')),
  buy_price       numeric(14,4),
  amount_invested numeric(14,2),
  decided_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (email, pick_number)
);

create index if not exists user_pick_status_email_idx
  on public.user_pick_status (email, decided_at desc);

create index if not exists user_pick_status_status_idx
  on public.user_pick_status (email, status);

-- bought rows MUST carry buy_price + amount; skipped rows leave them null.
alter table public.user_pick_status
  add constraint user_pick_status_bought_has_price
  check (
    (status = 'bought' and buy_price is not null and amount_invested is not null)
    or status = 'skipped'
  );

-- keep updated_at fresh on every UPDATE.
create or replace function public.user_pick_status_set_updated_at()
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

drop trigger if exists user_pick_status_updated_at on public.user_pick_status;
create trigger user_pick_status_updated_at
  before update on public.user_pick_status
  for each row execute function public.user_pick_status_set_updated_at();

-- RLS: service role only. iOS app reaches this via /api/picks endpoints, never
-- direct PostgREST. Keeps the table closed by default.
alter table public.user_pick_status enable row level security;
revoke all on public.user_pick_status from anon, authenticated;

-- Per-user default investment amount. NULL = user hasn't set one; the mini-sheet
-- shows the "Recordar como default" toggle until they do.
alter table public.subscribers
  add column if not exists default_investment numeric(10,2)
  check (default_investment is null or default_investment > 0);
