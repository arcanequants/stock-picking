/**
 * Static feature flags. Flip a constant and redeploy to toggle a section.
 *
 * QUANT_LAB_ENABLED: gates the whole Quant Lab surface (nav links, public
 * routes, API endpoints, sitemap entries, SEO service schema, and the Binance
 * ingest cron). Disabled while we're not running the lab. Set to `true` to
 * bring it all back.
 */
export const QUANT_LAB_ENABLED = false;
