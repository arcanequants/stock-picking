-- 037 · Ad attribution on subscribers (paid acquisition launch).
-- First-touch UTM/click params captured client-side into the `vd_attr`
-- cookie (90d) and copied here by /api/auth/free-register at signup.
-- Shape: {"utm_source":"meta","utm_campaign":"...","fbclid":"...",
--          "landing":"/join","ts":"2026-07-19T..."}
alter table public.subscribers
  add column if not exists attribution jsonb;

comment on column public.subscribers.attribution is
  'First-touch ad attribution (utm_* / fbclid / twclid / landing / ts) captured at signup.';
