-- 039_briefings.sql
-- Archive for the daily marketing briefing (the "Director" routine's output).
--
-- Why: the briefing used to be archived as briefings/YYYY-MM-DD.json committed
-- to the repo by the cloud routine via the GitHub Contents API. That path died
-- on 2026-06-23 when the routine sandbox lost egress to api.github.com, and it
-- also forced a production deploy per briefing. The routine now publishes
-- through the MCP tool `publish_briefing`, which emails it and archives it
-- here. The legacy files stay in the repo as history.
--
-- Service-role only: this is internal marketing content, never user-facing.

create table if not exists public.briefings (
  date date primary key,
  summary text,
  causal_chain text,
  drafts jsonb not null,
  table_rows jsonb,
  draft_count int generated always as (jsonb_array_length(drafts)) stored,
  email_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.briefings is
  'Daily marketing briefing archive. One row per CDMX date, upserted by the publish_briefing MCP tool.';

create index if not exists briefings_created_at_idx
  on public.briefings (created_at desc);

alter table public.briefings enable row level security;

-- No policies on purpose: anon/authenticated get nothing, the service role
-- bypasses RLS. Same posture as the other internal tables.
