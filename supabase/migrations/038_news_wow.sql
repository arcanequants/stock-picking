-- 038_news_wow.sql
-- "Vectorial Noticias" v2: taxonomy + explainer blocks + user preferences +
-- per-news AI chat threads.
--
-- 1. app_news gains topic/regions/tickers (push targeting + feed filters)
--    and the 4-block explainer format (qué pasó / por qué importa / y para
--    tu portafolio / cuéntalo así) plus a small glossary. All nullable /
--    defaulted so existing rows and the existing publisher keep working —
--    enrichment happens server-side at ingest.
-- 2. app_news_i18n mirrors the new translatable fields.
-- 3. user_news_prefs: which topics/regions a user wants pushed and when
--    (instant / daily digest / none). No row = everything on, instant
--    (current behavior, backwards compatible).
-- 4. news_chat_messages: per-user, per-news AI chat threads (premium+trial).

-- 1. app_news taxonomy + explainer blocks -----------------------------------
alter table public.app_news
  add column if not exists topic text not null default 'markets'
    check (topic in ('picks','companies','economy','politics','markets')),
  add column if not exists regions text[] not null default '{global}',
  add column if not exists tickers text[],
  add column if not exists block_what text,
  add column if not exists block_why text,
  add column if not exists block_you text,
  add column if not exists block_tell text,
  add column if not exists glossary jsonb;

-- 2. i18n mirror -------------------------------------------------------------
alter table public.app_news_i18n
  add column if not exists block_what text,
  add column if not exists block_why text,
  add column if not exists block_you text,
  add column if not exists block_tell text,
  add column if not exists glossary jsonb;

-- 3. user preferences --------------------------------------------------------
create table if not exists public.user_news_prefs (
  email      text primary key,
  topics     text[] not null default '{companies,economy,politics,markets}',
  regions    text[] not null default '{global,us,mx,br,in,eu,asia}',
  delivery   text not null default 'instant'
    check (delivery in ('instant','daily','none')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.user_news_prefs_set_updated_at()
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

drop trigger if exists user_news_prefs_updated_at on public.user_news_prefs;
create trigger user_news_prefs_updated_at
  before update on public.user_news_prefs
  for each row execute function public.user_news_prefs_set_updated_at();

alter table public.user_news_prefs enable row level security;
revoke all on public.user_news_prefs from anon, authenticated;

-- 4. chat threads ------------------------------------------------------------
create table if not exists public.news_chat_messages (
  id         uuid primary key default gen_random_uuid(),
  news_id    uuid not null references public.app_news(id) on delete cascade,
  email      text not null,
  role       text not null check (role in ('user','assistant')),
  content    text not null check (char_length(content) between 1 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists news_chat_messages_thread_idx
  on public.news_chat_messages (email, news_id, created_at);

alter table public.news_chat_messages enable row level security;
revoke all on public.news_chat_messages from anon, authenticated;
