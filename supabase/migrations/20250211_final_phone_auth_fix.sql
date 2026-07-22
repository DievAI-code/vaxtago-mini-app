-- 1. Обновление структуры таблицы users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    language_code TEXT DEFAULT 'uz',
    avatar_url TEXT,
    country TEXT,
    city TEXT,
    role TEXT DEFAULT 'user',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Добавляем колонки, если таблица уже существовала
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'uz';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Уникальный индекс для работы UPSERT (on_conflict)
-- Удаляем старое ограничение если было и создаем чистое
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_number_unique ON public.users (phone_number);

-- 3. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики для чистоты
DROP POLICY IF EXISTS "Public access to users" ON public.users;
DROP POLICY IF EXISTS "Allow anonymous upsert" ON public.users;

-- Политика: разрешаем создание и обновление профиля по номеру телефона (для Login flow)
CREATE POLICY "Allow anonymous upsert" 
ON public.users 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Обновление кэша PostgREST
NOTIFY pgrst, 'reload schema';