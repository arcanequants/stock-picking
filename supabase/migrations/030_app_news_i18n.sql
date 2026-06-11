-- 030_app_news_i18n.sql
-- Translated headline + body for app_news items.
-- Falls back to the base app_news row when no translation exists for the
-- requested locale. Only en + pt are populated; hi stays frozen (SEBI gate).
--
-- /api/news fetches these rows when Accept-Language is en or pt and overlays
-- the translated fields before returning the news array to iOS.

create table if not exists public.app_news_i18n (
  id          uuid primary key default gen_random_uuid(),
  news_id     uuid not null references public.app_news(id) on delete cascade,
  locale      text not null check (locale in ('en', 'pt')),
  headline    text not null check (char_length(headline) between 1 and 80),
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (news_id, locale)
);

create index if not exists app_news_i18n_news_id_locale_idx
  on public.app_news_i18n (news_id, locale);

create or replace function public.app_news_i18n_set_updated_at()
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

drop trigger if exists app_news_i18n_updated_at on public.app_news_i18n;
create trigger app_news_i18n_updated_at
  before update on public.app_news_i18n
  for each row execute function public.app_news_i18n_set_updated_at();

-- RLS: service role only (same pattern as app_news)
alter table public.app_news_i18n enable row level security;
revoke all on public.app_news_i18n from anon, authenticated;
