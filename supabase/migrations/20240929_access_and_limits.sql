-- Ensure subscription_status column exists on telegram_users
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'FREE';

-- Daily usage limits table
CREATE TABLE IF NOT EXISTS user_limits (
  telegram_id BIGINT NOT NULL REFERENCES telegram_users(telegram_id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_requests INTEGER DEFAULT 0,
  vacancy_searches INTEGER DEFAULT 0,
  translations INTEGER DEFAULT 0,
  document_scans INTEGER DEFAULT 0,
  employer_checks INTEGER DEFAULT 0,
  PRIMARY KEY (telegram_id, date)
);

-- RLS (Edge Functions use service role)
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service user_limits" ON user_limits FOR ALL USING (true) WITH CHECK (true);