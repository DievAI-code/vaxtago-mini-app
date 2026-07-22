-- 1. Исправление структуры таблицы users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'uz',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Создание уникального индекса для работы UPSERT (onConflict)
-- Если индекс уже есть, пропускаем
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_number_key') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);
    END IF;
END $$;

-- 3. Настройка Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики для чистоты
DROP POLICY IF EXISTS "Allow public upsert by phone" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Политика: разрешаем любому (anon/auth) создавать/обновлять профиль по номеру телефона
CREATE POLICY "Allow public upsert by phone" 
ON public.users 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Обновление кэша PostgREST
NOTIFY pgrst, 'reload schema';