-- 032_api_balance_micro_usdc.sql
-- Phase 1 of the unified billing redesign (locked with Alberto 2026-06-13).
-- Move from "credits" to a single prepaid micro-USDC balance per API key.
--   - Unit: micro-USDC. 1 USDC = 1_000_000 micro. 1 legacy credit = $0.002 = 2000 micro.
--   - Existing keys: flat 5 USDC courtesy backfill (NOT the converted ~$0.20 of old
--     credits) so every existing signup gets one "minimum deposit" worth of free usage
--     to convert. Alberto: "regala 5 usd para que lo usen, 100 es muchísimo."
--   - tier (free/pro) + content gating stay UNTOUCHED here — that's Phase 3.
--   - 5 USDC minimum DEPOSIT enforcement + recargas redesign come in Phase 4.
--   - x402 endpoint USD prices become the per-endpoint costs in Phase 2.

-- ── api_keys: credits_remaining (int credits) → balance_micro (bigint micro-USDC) ──
alter table public.api_keys
  rename column credits_remaining to balance_micro;

alter table public.api_keys
  alter column balance_micro type bigint using balance_micro::bigint,
  alter column balance_micro set default 0;

-- Flat 5 USDC courtesy for every existing key (overwrites old credit balances).
update public.api_keys
   set balance_micro = 5000000;

-- ── api_credit_ledger: delta_credits (int) → delta_micro (bigint) ──
alter table public.api_credit_ledger
  rename column delta_credits to delta_micro;

alter table public.api_credit_ledger
  alter column delta_micro type bigint using delta_micro::bigint;

-- ── RPC: atomic debit in micro-USDC ──────────────────────────
-- Called on every paid API request. Returns the new balance (micro-USDC) on
-- success, or NULL when the key is invalid/revoked/expired or would go negative
-- (caller should respond 402). FOR UPDATE serializes concurrent spends.
-- Replaces debit_api_credits (dropped — the rename is intentional, the unit changed).
drop function if exists public.debit_api_credits(text, integer, text);

create or replace function public.debit_api_balance(
  p_key_hash text,
  p_micro    bigint,
  p_endpoint text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.api_keys%rowtype;
  v_new bigint;
begin
  if p_micro <= 0 then
    raise exception 'p_micro must be positive';
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
  if v_row.balance_micro < p_micro then
    return null;
  end if;

  v_new := v_row.balance_micro - p_micro;

  update public.api_keys
     set balance_micro = v_new,
         last_used_at  = now()
   where id = v_row.id;

  -- Ledger insert only when the key is bound to an account (orphan keys just
  -- have their balance decremented — mirrors the 022 fix).
  if v_row.account_id is not null then
    insert into public.api_credit_ledger (account_id, api_key_id, delta_micro, source, endpoint)
    values (v_row.account_id, v_row.id, -p_micro, 'debit_request', p_endpoint);
  end if;

  return v_new;
end;
$$;

revoke all on function public.debit_api_balance(text, bigint, text) from anon, authenticated;
grant execute on function public.debit_api_balance(text, bigint, text) to service_role;

-- ── RPC: credit grant / top-up in micro-USDC ─────────────────
-- Used by: signup grant, Stripe top-up webhook, crypto top-up, manual adjustments.
-- Idempotent on stripe_payment_intent_id when provided.
drop function if exists public.credit_api_balance(uuid, uuid, integer, text, text, text);

create or replace function public.credit_api_balance(
  p_account_id uuid,
  p_api_key_id uuid,
  p_micro      bigint,
  p_source     text,
  p_stripe_payment_intent_id text default null,
  p_notes      text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing uuid;
  v_balance  bigint;
begin
  if p_micro <= 0 then
    raise exception 'p_micro must be positive';
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
      select balance_micro into v_balance from public.api_keys where id = p_api_key_id;
      return v_balance;
    end if;
  end if;

  insert into public.api_credit_ledger (account_id, api_key_id, delta_micro, source, stripe_payment_intent_id, notes)
  values (p_account_id, p_api_key_id, p_micro, p_source, p_stripe_payment_intent_id, p_notes);

  if p_api_key_id is not null then
    update public.api_keys
       set balance_micro = balance_micro + p_micro
     where id = p_api_key_id
    returning balance_micro into v_balance;
  end if;

  return coalesce(v_balance, 0);
end;
$$;

revoke all on function public.credit_api_balance(uuid, uuid, bigint, text, text, text) from anon, authenticated;
grant execute on function public.credit_api_balance(uuid, uuid, bigint, text, text, text) to service_role;
