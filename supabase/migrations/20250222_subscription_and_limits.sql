-- Исправление таблицы пользователей и добавление полей лимитов
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_requests_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ocr_requests_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS map_requests_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_limit_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Создание таблицы логов использования (опционально для детальной аналитики)
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    feature_type TEXT, -- 'ai', 'ocr', 'map'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Обновление существующих записей
UPDATE users SET subscription_status = 'free' WHERE subscription_status IS NULL;