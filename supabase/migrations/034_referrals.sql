-- 034 · Referral program
-- Rule: every referred user who PAYS earns the referrer +1 free month.
-- Accumulates, no cap. Stripe referrers get an automatic balance credit; Apple
-- referrers accrue unapplied credit here (redeemed later via Apple Offer Codes).

create table if not exists referral_codes (
  user_email text primary key,
  code       text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists referrals (
  id             bigserial primary key,
  referrer_email text not null,
  referred_email text not null unique,   -- a person can only be referred once
  code           text not null,
  status         text not null default 'pending',  -- pending | converted | void
  created_at     timestamptz not null default now(),
  converted_at   timestamptz
);
create index if not exists idx_referrals_referrer on referrals (referrer_email);
create index if not exists idx_referrals_status on referrals (status);

create table if not exists referral_credits (
  id                 bigserial primary key,
  user_email         text not null,        -- the referrer being rewarded
  months_granted     int not null default 1,
  source_referral_id bigint references referrals (id),
  applied            boolean not null default false,  -- applied to Stripe balance / Apple offer
  applied_via        text,                 -- 'stripe_balance' | 'apple_offer_code' | null
  created_at         timestamptz not null default now()
);
create index if not exists idx_referral_credits_user on referral_credits (user_email);
create index if not exists idx_referral_credits_unapplied
  on referral_credits (user_email) where applied = false;
