-- Device tokens — stores APNs/FCM push tokens for iOS/Android apps.
-- One row per (email, token). Multiple devices per user allowed.
-- On uninstall, APNs eventually returns "Unregistered" — we soft-delete those (set is_active = false).

CREATE TABLE IF NOT EXISTS device_tokens (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  app_version TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_unique
  ON device_tokens(email, token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_email_active
  ON device_tokens(email) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform_active
  ON device_tokens(platform) WHERE is_active = TRUE;
