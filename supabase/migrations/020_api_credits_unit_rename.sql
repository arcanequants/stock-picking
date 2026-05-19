-- 020_api_credits_unit_rename.sql
-- Phase 1.2 follow-up: rename `_cents` to `credits` since 1 credit = $0.002
-- (not 1 cent). The original 019 column names were misleading. This migration:
--   - renames credits_remaining_cents → credits_remaining
--   - renames delta_cents → delta_credits
--   - bumps default + backfill to 100 free credits ($0.20 lifetime gift)
--   - rewrites the two RPCs with the new param names (p_cents → p_credits)
-- Decided 2026-05-17 with Alberto.

-- ── api_keys column rename + default bump ──────────────────
alter table public.api_keys
  rename column credits_remaining_cents to credits_remaining;

alter table public.api_keys
  alter column credits_remaining set default 100;

-- Bump existing rows that still carry the old default of 20.
update public.api_keys
   set credits_remaining = 100
 where credits_remaining = 20;

-- ── api_credit_ledger column rename ────────────────────────
alter table public.api_credit_ledger
  rename column delta_cents to delta_credits;

-- ── RPC rewrites (drop + recreate, param signatures change) ─
drop function if exists public.debit_api_credits(text, integer, text);
drop function if exists public.credit_api_balance(uuid, uuid, integer, text, text, text);

create or replace function public.debit_api_credits(p_key_hash text, p_credits integer, p_endpoint text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row         public.api_keys%rowtype;
  v_new_balance integer;
begin
  if p_credits <= 0 then
    raise exception 'p_credits must be positive';
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
  if v_row.credits_remaining < p_credits then
    return null;
  end if;

  v_new_balance := v_row.credits_remaining - p_credits;

  update public.api_keys
     set credits_remaining = v_new_balance,
         last_used_at      = now()
   where id = v_row.id;

  insert into public.api_credit_ledger (account_id, api_key_id, delta_credits, source, endpoint)
  values (v_row.account_id, v_row.id, -p_credits, 'debit_request', p_endpoint);

  return v_new_balance;
end;
$$;

revoke all on function public.debit_api_credits(text, integer, text) from anon, authenticated;
grant execute on function public.debit_api_credits(text, integer, text) to service_role;

create or replace function public.credit_api_balance(
  p_account_id uuid,
  p_api_key_id uuid,
  p_credits integer,
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
  v_existing uuid;
  v_balance  integer;
begin
  if p_credits <= 0 then
    raise exception 'p_credits must be positive';
  end if;
  if p_source not in ('grant_signup','grant_promo','topup_stripe','topup_crypto','refund','adjustment') then
    raise exception 'invalid source: %', p_source;
  end if;

  -- Idempotency on Stripe payment intent.
  if p_stripe_payment_intent_id is not null then
    select id into v_existing
      from public.api_credit_ledger
     where stripe_payment_intent_id = p_stripe_payment_intent_id;
    if v_existing is not null then
      select credits_remaining into v_balance from public.api_keys where id = p_api_key_id;
      return v_balance;
    end if;
  end if;

  insert into public.api_credit_ledger (account_id, api_key_id, delta_credits, source, stripe_payment_intent_id, notes)
  values (p_account_id, p_api_key_id, p_credits, p_source, p_stripe_payment_intent_id, p_notes);

  if p_api_key_id is not null then
    update public.api_keys
       set credits_remaining = credits_remaining + p_credits
     where id = p_api_key_id
    returning credits_remaining into v_balance;
  end if;

  return coalesce(v_balance, 0);
end;
$$;

revoke all on function public.credit_api_balance(uuid, uuid, integer, text, text, text) from anon, authenticated;
grant execute on function public.credit_api_balance(uuid, uuid, integer, text, text, text) to service_role;
