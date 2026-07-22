-- Добавляем поле premium в таблицу пользователей
ALTER TABLE public.telegram_users 
ADD COLUMN IF NOT EXISTS premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'FREE';

-- Создаем таблицу подписок
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT NOT NULL,
    plan TEXT DEFAULT 'premium',
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'expired'
    payment_provider TEXT DEFAULT 'global_pay',
    payment_id TEXT, -- telegram_payment_charge_id
    amount INTEGER,
    currency TEXT DEFAULT 'UZS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_subscriptions_telegram_id ON public.subscriptions(telegram_id);

-- Обновляем кэш
NOTIFY pgrst, 'reload schema';