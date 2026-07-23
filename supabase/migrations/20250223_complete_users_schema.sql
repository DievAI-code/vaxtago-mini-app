-- Убеждаемся, что все поля профиля присутствуют
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'ru',
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_requests_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ocr_requests_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS map_requests_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_limit_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Добавляем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);