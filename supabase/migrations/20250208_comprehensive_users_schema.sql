-- 1. Добавляем все недостающие колонки в таблицу users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'uz',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS telegram_id BIGINT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Обеспечиваем уникальность для корректной работы UPSERT
-- Удаляем старые ограничения если они есть и создаем новые
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_number_key') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_telegram_id_key') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_telegram_id_key UNIQUE (telegram_id);
  END IF;
END $$;

-- 3. Обновляем кэш PostgREST (выполняется автоматически при DDL, но добавим уведомление)
NOTIFY pgrst, 'reload schema';

COMMENT ON TABLE public.users IS 'Unified user table for VaxtaGo Web and Telegram App';