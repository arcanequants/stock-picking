-- 033 · Web 14-day free trial (no card)
-- New web signups become `subscribers` rows with subscription_source='trial'
-- and subscription_status='trialing'. These two columns track when the trial
-- ends and which reminder emails have already gone out, so the trial-expiry
-- cron is idempotent (no double-sends, no double-downgrades).
--
-- The `subscribers` table predates the migrations folder, so we only ADD
-- columns here (same pattern as 025/028). Safe to run more than once.

alter table subscribers
  add column if not exists trial_ends_at timestamptz;

alter table subscribers
  add column if not exists trial_reminder_stage smallint not null default 0;

comment on column subscribers.trial_ends_at is
  'When a web (subscription_source=''trial'') free trial expires. NULL for paid subs.';
comment on column subscribers.trial_reminder_stage is
  'Trial reminder progress: 0=none, 1=halfway (<=7d left), 2=ending (<=1d left), 3=expired email sent. Prevents duplicate reminders.';

-- Speeds up the daily trial-expiry cron sweep.
create index if not exists idx_subscribers_trial
  on subscribers (subscription_source, subscription_status, trial_ends_at)
  where subscription_source = 'trial';
