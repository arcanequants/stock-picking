-- AI Crawler Logs — stores bot visits detected by middleware
CREATE TABLE IF NOT EXISTS ai_crawler_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_name TEXT NOT NULL,
  bot_category TEXT NOT NULL CHECK (bot_category IN ('search', 'training', 'unknown')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crawler_logs_created_at ON ai_crawler_logs(created_at DESC);
CREATE INDEX idx_crawler_logs_bot_name ON ai_crawler_logs(bot_name);

-- RLS: disable for this table (only service_role writes via middleware)
ALTER TABLE ai_crawler_logs ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service_role key can access (which is what we want)
