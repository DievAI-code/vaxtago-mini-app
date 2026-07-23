-- 1. Добавление роли в таблицу пользователей
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'premium', 'admin', 'founder'));

-- 2. Таблица сессий администраторов
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 3. Таблица логов действий администратора
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    action TEXT NOT NULL, -- 'grant_premium', 'change_setting', etc.
    target_user_id UUID REFERENCES users(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Настройки проекта (управляемые через админку)
CREATE TABLE IF NOT EXISTS project_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Начальные настройки
INSERT INTO project_settings (key, value) VALUES 
('ai_config', '{"model": "google/gemini-2.0-flash-exp:free", "enabled": true}'),
('free_limits', '{"ai_daily": 10, "ocr_daily": 5, "map_daily": 5}'),
('features_status', '{"ai": true, "ocr": true, "maps": true, "premium": true}')
ON CONFLICT (key) DO NOTHING;

-- 5. RLS Политики
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Founder имеет доступ ко всему
CREATE POLICY "Founders full access to admin_actions" ON admin_actions
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'founder'));

CREATE POLICY "Founders full access to admin_sessions" ON admin_sessions
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'founder'));