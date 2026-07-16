-- Subscriptions table for VaxtaGo Premium via Telegram Payments
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL,
  status text NOT NULL DEFAULT 'PREMIUM',
  payment_id text,
  amount integer,
  currency text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_telegram_id ON public.subscriptions (telegram_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);