-- 022_debit_ledger_orphan_keys.sql
-- Fix: debit_api_credits raised on orphan keys (no account_id) because the
-- ledger insert violated NOT NULL on api_credit_ledger.account_id. The
-- transaction rolled back so the RPC returned null, and the v1 middleware
-- responded 402 to every authenticated call from a registration-only key.
-- (createApiKey already handled this case for the signup grant — mirror it
-- here so debits behave the same way.)

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

  -- Ledger insert only when the key is bound to an account. Orphan keys
  -- (registration-only, no auth.users row) just have their balance decremented.
  if v_row.account_id is not null then
    insert into public.api_credit_ledger (account_id, api_key_id, delta_credits, source, endpoint)
    values (v_row.account_id, v_row.id, -p_credits, 'debit_request', p_endpoint);
  end if;

  return v_new_balance;
end;
$$;

revoke all on function public.debit_api_credits(text, integer, text) from anon, authenticated;
grant execute on function public.debit_api_credits(text, integer, text) to service_role;
