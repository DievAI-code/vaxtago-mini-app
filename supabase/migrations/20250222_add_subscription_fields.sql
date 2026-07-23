-- Добавление полей для управления подпиской и лимитами AI
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_requests_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_requests_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Создание индекса для оптимизации запросов по статусу
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_status);

-- Обновление RLS политик (если требуется доступ к этим полям)
-- Поля уже защищены существующими политиками для таблицы users