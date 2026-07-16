-- Subscriptions table (per spec)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL REFERENCES telegram_users(telegram_id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'FREE',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Daily usage limits for FREE plan
CREATE TABLE IF NOT EXISTS daily_usage (
  telegram_id BIGINT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_requests INTEGER DEFAULT 0,
  translations INTEGER DEFAULT 0,
  job_searches INTEGER DEFAULT 0,
  PRIMARY KEY (telegram_id, usage_date)
);

-- RLS (Edge Functions use service role; policies allow service access)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service subscriptions" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service daily_usage" ON daily_usage FOR ALL USING (true) WITH CHECK (true);