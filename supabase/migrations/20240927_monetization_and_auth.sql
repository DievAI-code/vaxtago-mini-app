-- Add verified boolean to telegram_users (single source of truth for auth)
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'new';

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES telegram_users(telegram_id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI balance / credits
CREATE TABLE IF NOT EXISTS ai_balance (
  user_id BIGINT PRIMARY KEY REFERENCES telegram_users(telegram_id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES telegram_users(telegram_id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  payment_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default plans
INSERT INTO subscription_plans (id, name, price, duration_days, features) VALUES
('FREE', 'FREE', 0, 30, '["10 AI requests", "3 translations", "5 address scans"]'::jsonb),
('PRO', 'VaxtaGo PRO', 4.99, 30, '["unlimited AI", "document translation", "employer check", "legal helper", "document storage"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- RLS (edge functions use service role key, but policies protect direct access)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read plans" ON subscription_plans FOR SELECT USING (true);
CREATE POLICY "Service manage subscriptions" ON user_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service manage balance" ON ai_balance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service manage payments" ON payments FOR ALL USING (true) WITH CHECK (true);