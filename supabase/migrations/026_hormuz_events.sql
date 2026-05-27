-- 026_hormuz_events.sql
-- Pre-populated cache of Global Fishing Watch events filtered to the
-- Strait of Hormuz bbox. The /api/signals/hormuz/gfw/events route used
-- to walk GFW pagination on each request — each page costs ~35s and
-- some datasets (loitering, port-visits) exceed any reasonable function
-- timeout. We move that walk to an overnight cron that upserts here,
-- and the API serves from this table in milliseconds.
--
-- Hormuz bbox at write time: lon [54, 59], lat [24, 28.5].
-- Retention: 60 days. Older rows are deleted at the end of each sync.

create table if not exists public.hormuz_events (
  id            text        primary key,
  type          text        not null check (type in ('gaps','encounters','port-visits','loitering')),
  start_ts      timestamptz not null,
  end_ts        timestamptz,
  lat           double precision not null,
  lon           double precision not null,
  vessel_name   text,
  vessel_flag   text,
  vessel_type   text,
  counterparty_name text,
  counterparty_flag text,
  port_name     text,
  port_flag     text,
  raw           jsonb       not null,
  ingested_at   timestamptz not null default now()
);

-- Primary query pattern: events of one type, newest first, last 30d.
create index if not exists hormuz_events_type_start_idx
  on public.hormuz_events (type, start_ts desc);

-- For staleness checks ("when did we last sync?") and retention sweeps.
create index if not exists hormuz_events_ingested_idx
  on public.hormuz_events (ingested_at desc);

-- RLS: this table is only ever read by server routes using the service
-- role key (which bypasses RLS). No client-side reads. Enable RLS with
-- no permissive policies so accidental anon-key reads fail closed.
alter table public.hormuz_events enable row level security;

comment on table public.hormuz_events is
  'GFW events (gaps/encounters/port-visits/loitering) pre-filtered to '
  'the Strait of Hormuz bbox. Populated nightly by /api/cron/hormuz-'
  'events-sync. Served by /api/signals/hormuz/gfw/events.';
