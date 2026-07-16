-- 036 · Allow Hindi in app_news_i18n (hi content unfrozen 2026-07-12).
-- News auto-translate to en/pt/hi at creation via /api/admin/news.
alter table public.app_news_i18n
  drop constraint if exists app_news_i18n_locale_check;
alter table public.app_news_i18n
  add constraint app_news_i18n_locale_check check (locale in ('en', 'pt', 'hi'));
