-- 035 · Fase B: WhatsApp channel retired (2026-07-04)
-- The wa-track/wa-join-followup machinery was removed from the codebase and
-- all subscribers were migrated to delivery_channel='email' via data update.
-- This drops the now-orphaned tracking columns. Safe to run more than once.

alter table subscribers drop column if exists wa_click_at;
alter table subscribers drop column if exists wa_followup_sent_at;
