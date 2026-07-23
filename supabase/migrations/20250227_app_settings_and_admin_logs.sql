-- Таблица глобальных настроек системы и режимов подписки
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

-- Журнал действий администратора (Founder)
CREATE TABLE IF NOT EXISTS admin_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action text NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS для открытого чтения настроек пользователями
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read app_settings" ON app_settings;
CREATE POLICY "Public read app_settings" ON app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public write app_settings" ON app_settings;
CREATE POLICY "Public write app_settings" ON app_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Public all admin_logs" ON admin_logs;
CREATE POLICY "Public all admin_logs" ON admin_logs FOR ALL USING (true);