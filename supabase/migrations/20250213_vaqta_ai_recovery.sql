-- 1. Очистка и создание таблицы users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    language_code TEXT, -- Будет заполнено после выбора языка
    avatar_url TEXT,
    country TEXT,
    city TEXT,
    role TEXT DEFAULT 'user',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Индексы и ограничения
DROP INDEX IF EXISTS users_phone_number_idx;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_number_idx ON public.users (phone_number);

-- 3. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public upsert access" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;

-- Разрешаем анонимный UPSERT (регистрация/вход)
CREATE POLICY "Public access" 
ON public.users 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Обновление кэша схемы
NOTIFY pgrst, 'reload schema';