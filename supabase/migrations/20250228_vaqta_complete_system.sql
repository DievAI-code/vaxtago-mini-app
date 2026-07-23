-- VAQTA AI Consolidated Migration Script

-- 1. Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number text UNIQUE NOT NULL,
    first_name text,
    last_name text,
    language_code text DEFAULT 'ru',
    avatar_url text,
    role text DEFAULT 'user', -- 'user', 'admin', 'founder'
    subscription_status text DEFAULT 'free', -- 'free', 'premium', 'trial'
    subscription_expires_at timestamp with time zone,
    ai_requests_used integer DEFAULT 0,
    ocr_requests_used integer DEFAULT 0,
    map_requests_used integer DEFAULT 0,
    job_searches_used integer DEFAULT 0,
    last_limit_reset timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Таблица настроек системы
CREATE TABLE IF NOT EXISTS app_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    premium_mode text NOT NULL DEFAULT 'off', -- 'off', 'selected', 'all'
    ai_limit_free integer NOT NULL DEFAULT 10,
    ocr_limit_free integer NOT NULL DEFAULT 5,
    map_limit_free integer NOT NULL DEFAULT 5,
    jobs_limit_free integer NOT NULL DEFAULT 5,
    updated_at timestamp with time zone DEFAULT now()
);

-- Вставляем дефолтную запись если таблица пуста
INSERT INTO app_settings (id, premium_mode, ai_limit_free, ocr_limit_free, map_limit_free, jobs_limit_free)
SELECT gen_random_uuid(), 'off', 10, 5, 5, 5
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

-- 3. Сообщения AI Ассистента
CREATE TABLE IF NOT EXISTS assistant_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    role text NOT NULL, -- 'user', 'assistant'
    content text NOT NULL,
    language text DEFAULT 'ru',
    model_used text,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. История OCR распознаваний
CREATE TABLE IF NOT EXISTS ocr_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    original_text text,
    translated_text text,
    target_language text DEFAULT 'ru',
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Кэш вакансий
CREATE TABLE IF NOT EXISTS jobs_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    source text NOT NULL,
    external_id text NOT NULL,
    title text NOT NULL,
    company text,
    salary text,
    city text,
    description text,
    url text UNIQUE,
    schedule text,
    created_at timestamp with time zone DEFAULT now()
);

-- 6. Заявки на вакансии
CREATE TABLE IF NOT EXISTS job_interest (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    profession text NOT NULL,
    city text,
    schedule text,
    created_at timestamp with time zone DEFAULT now()
);

-- 7. Логи администратора
CREATE TABLE IF NOT EXISTS admin_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action text NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT now()
);

-- Индексы для ускорения работы
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_user ON assistant_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_history_user ON ocr_history(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_cache_title ON jobs_cache(title);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public all users" ON users;
CREATE POLICY "Public all users" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Public all app_settings" ON app_settings;
CREATE POLICY "Public all app_settings" ON app_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Public all assistant_messages" ON assistant_messages;
CREATE POLICY "Public all assistant_messages" ON assistant_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Public all ocr_history" ON ocr_history;
CREATE POLICY "Public all ocr_history" ON ocr_history FOR ALL USING (true);

DROP POLICY IF EXISTS "Public all jobs_cache" ON jobs_cache;
CREATE POLICY "Public all jobs_cache" ON jobs_cache FOR ALL USING (true);

DROP POLICY IF EXISTS "Public all job_interest" ON job_interest;
CREATE POLICY "Public all job_interest" ON job_interest FOR ALL USING (true);

DROP POLICY IF EXISTS "Public all admin_logs" ON admin_logs;
CREATE POLICY "Public all admin_logs" ON admin_logs FOR ALL USING (true);