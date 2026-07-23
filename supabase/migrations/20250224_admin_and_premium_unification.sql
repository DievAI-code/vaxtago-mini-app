-- 1. Таблица администраторов
CREATE TABLE IF NOT EXISTS admin_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number text UNIQUE NOT NULL,
    role text DEFAULT 'founder',
    created_at timestamp with time zone DEFAULT now()
);

-- Добавляем основателя
INSERT INTO admin_users (phone_number, role) 
VALUES ('89138830659', 'founder')
ON CONFLICT (phone_number) DO NOTHING;

-- 2. Таблица истории OCR
CREATE TABLE IF NOT EXISTS ocr_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    image_url text,
    original_text text,
    translated_text text,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Обновление таблицы пользователей (добавление колонок лимитов и подписки)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS premium_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ai_requests_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_requests_limit integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS ocr_requests_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS map_requests_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_limit_reset timestamp with time zone DEFAULT now();

-- 4. Политики безопасности для админ-панели (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with users" 
ON users FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE phone_number = (SELECT phone_number FROM users WHERE id = auth.uid()) 
    AND role = 'founder'
  )
);