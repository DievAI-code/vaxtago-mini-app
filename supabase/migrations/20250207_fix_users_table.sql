-- Миграция для синхронизации таблицы пользователей с фронтендом
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'uz',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Добавляем уникальный индекс для корректной работы UPSERT
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_number_key') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);
  END IF;
END $$;