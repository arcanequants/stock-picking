-- 019_api_credits.sql
-- Phase 1 of API billing rebuild: prepaid credit model.
-- Replaces daily_limit/requests_today with a credit balance funded by Stripe.
-- 1 credit = 1 request = $0.002 USD (matches existing x402 pricing).
--
-- Decisions locked 2026-05-17 with Alberto:
--   - 100 lifetime free credits on signup (= $0.20 valor regalado, not $100)
--   - Custom api_credit_ledger with Stripe as source-of-funds (allows promo grants)
--   - x402 stays live in parallel (crypto-native devs)
--   - $0.002 per request (no launch promo)

-- ── api_keys upgrade ────────────────────────────────────────
-- Add account scoping, SHA-256 hashing, soft-delete, last-used tracking,
-- and the per-key credit balance (mirror of ledger SUM for fast read).
alter table public.api_keys
  add column if not exists account_id              uuid references auth.users(id) on delete cascade,
  add column if not exists key_hash                text,
  add column if not exists credits_remaining_cents integer not null default 20,  -- 100 free credits × $0.002
  add column if not exists last_used_at            timestamptz,
  add column if not exists revoked_at              timestamptz;

create unique index if not exists api_keys_key_hash_uidx on public.api_keys (key_hash) where key_hash is not null;
create index if not exists api_keys_account_id_idx on public.api_keys (account_id) where revoked_at is null;

-- Backfill key_hash for existing rows so old keys keep working.
update public.api_keys
   set key_hash = encode(digest(key, 'sha256'), 'hex')
 where key_hash is null and key is not null;

-- ── api_credit_ledger ───────────────────────────────────────
-- Append-only ledger. Positive delta = grant or top-up. Negative delta = debit
-- from an API request. Balance is reconstructed via SUM(delta_cents) per account,
-- but api_keys.credits_remaining_cents is the hot path read (kept in sync).
create table if not exists public.api_credit_ledger (
  id                        uuid        primary key default gen_random_uuid(),
  account_id                uuid        not null references auth.users(id) on delete cascade,
  api_key_id                uuid        references public.api_keys(id) on delete set null,
  delta_cents               integer     not null,
  source                    text        not null check (source in ('grant_signup','grant_promo','topup_stripe','topup_crypto','debit_request','refund','adjustment')),
  stripe_payment_intent_id  text        unique,
  endpoint                  text,
  notes                     text,
  created_at                timestamptz not null default now()
);

create index if not exists api_credit_ledger_account_idx on public.api_credit_ledger (account_id, created_at desc);
create index if not exists api_credit_ledger_source_idx on public.api_credit_ledger (source);

alter table public.api_credit_ledger enable row level security;

-- Service role only (handler + cron + webhook). No direct user writes.
revoke all on public.api_credit_ledger from anon, authenticated;
grant select on public.api_credit_ledger to service_role;
grant insert on public.api_credit_ledger to service_role;

-- Owners can read their own ledger via RLS (for dashboard).
drop policy if exists ledger_owner_read on public.api_credit_ledger;
create policy ledger_owner_read on public.api_credit_ledger
  for select using (account_id = auth.uid());

-- ── RPC: atomic debit ──────────────────────────────────────
-- Called on every paid API request. Returns the new balance (cents) on success,
-- or NULL when balance would go negative (caller should 402).
-- FOR UPDATE prevents two concurrent requests over-spending the same key.
create or replace function public.debit_api_credits(p_key_hash text, p_cents integer, p_endpoint text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row        public.api_keys%rowtype;
  v_new_balance integer;
begin
  if p_cents <= 0 then
    raise exception 'p_cents must be positive';
  end if;

  select * into v_row
  from public.api_keys
  where key_hash = p_key_hash
  for update;

  if not found then
    return null;
  end if;
  if v_row.revoked_at is not null then
    return null;
  end if;
  if v_row.expires_at is not null and v_row.expires_at < now() then
    return null;
  end if;
  if v_row.credits_remaining_cents < p_cents then
    return null;
  end if;

  v_new_balance := v_row.credits_remaining_cents - p_cents;

  update public.api_keys
     set credits_remaining_cents = v_new_balance,
         last_used_at = now()
   where id = v_row.id;

  insert into public.api_credit_ledger (account_id, api_key_id, delta_cents, source, endpoint)
  values (v_row.account_id, v_row.id, -p_cents, 'debit_request', p_endpoint);

  return v_new_balance;
end;
$$;

revoke all on function public.debit_api_credits(text, integer, text) from anon, authenticated;
grant execute on function public.debit_api_credits(text, integer, text) to service_role;

-- ── RPC: credit grant / top-up ─────────────────────────────
-- Used by: signup grant (100 credits = 20 cents), Stripe top-up webhook,
-- manual promo grants. Idempotent on stripe_payment_intent_id when provided.
create or replace function public.credit_api_balance(
  p_account_id uuid,
  p_api_key_id uuid,
  p_cents integer,
  p_source text,
  p_stripe_payment_intent_id text default null,
  p_notes text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing  uuid;
  v_balance   integer;
begin
  if p_cents <= 0 then
    raise exception 'p_cents must be positive';
  end if;
  if p_source not in ('grant_signup','grant_promo','topup_stripe','topup_crypto','refund','adjustment') then
    raise exception 'invalid source: %', p_source;
  end if;

  -- Idempotency: if a row already exists for this payment_intent, do nothing.
  if p_stripe_payment_intent_id is not null then
    select id into v_existing
      from public.api_credit_ledger
     where stripe_payment_intent_id = p_stripe_payment_intent_id;
    if v_existing is not null then
      select credits_remaining_cents into v_balance from public.api_keys where id = p_api_key_id;
      return v_balance;
    end if;
  end if;

  insert into public.api_credit_ledger (account_id, api_key_id, delta_cents, source, stripe_payment_intent_id, notes)
  values (p_account_id, p_api_key_id, p_cents, p_source, p_stripe_payment_intent_id, p_notes);

  if p_api_key_id is not null then
    update public.api_keys
       set credits_remaining_cents = credits_remaining_cents + p_cents
     where id = p_api_key_id
    returning credits_remaining_cents into v_balance;
  end if;

  return coalesce(v_balance, 0);
end;
$$;

revoke all on function public.credit_api_balance(uuid, uuid, integer, text, text, text) from anon, authenticated;
grant execute on function public.credit_api_balance(uuid, uuid, integer, text, text, text) to service_role;
