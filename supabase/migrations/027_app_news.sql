-- 027_app_news.sql
-- App-only curated news feed. Alberto publishes from Terminal (via the
-- `news:publish` script), the server inserts a row + fires an APNs push
-- to every device whose user matches `audience`. The iOS app reads from
-- /api/news; the web site is intentionally untouched (web has its own
-- AI/SEO-oriented news scheme, the mobile app stays human-curated).
--
-- Audience is wired in from day 1 so we can later publish premium-only
-- news without a schema migration. V1 will publish everything as 'all'.

create table if not exists public.app_news (
  id               uuid primary key default gen_random_uuid(),
  headline         text not null check (char_length(headline) between 1 and 80),
  body             text not null check (char_length(body) between 1 and 4000),
  link_url         text,
  audience         text not null default 'all'
                   check (audience in ('all', 'premium')),
  published_at     timestamptz not null default now(),
  push_sent_at     timestamptz,
  push_sent_count  integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists app_news_published_at_idx
  on public.app_news (published_at desc);

create index if not exists app_news_audience_published_idx
  on public.app_news (audience, published_at desc);

-- keep updated_at fresh
create or replace function public.app_news_set_updated_at()
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

drop trigger if exists app_news_updated_at on public.app_news;
create trigger app_news_updated_at
  before update on public.app_news
  for each row execute function public.app_news_set_updated_at();

-- RLS: service role only. iOS hits /api/news; admin CLI hits /api/admin/news.
alter table public.app_news enable row level security;
revoke all on public.app_news from anon, authenticated;
