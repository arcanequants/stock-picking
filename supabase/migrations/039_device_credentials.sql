-- 039: Face ID / Touch ID re-login — per-device long-lived credentials.
--
-- The iOS app stores the RAW token in the Keychain protected by biometrics
-- (kSecAccessControl .biometryCurrentSet); the server only ever stores its
-- SHA-256 hash. Issued by /api/auth/device-credential (bearer-authed right
-- after a normal login), exchanged for a fresh Supabase session by
-- /api/auth/device-login. Revocable per row.

create table if not exists public.device_credentials (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  token_hash   text not null unique,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked      boolean not null default false
);

create index if not exists device_credentials_email_idx
  on public.device_credentials (email);

-- Service-role only: RLS on with zero policies = deny-all for anon/authed.
alter table public.device_credentials enable row level security;
