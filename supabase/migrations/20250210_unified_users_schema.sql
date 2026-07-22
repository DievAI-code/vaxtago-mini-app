-- 1. Создаем или обновляем таблицу users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT,
    telegram_id BIGINT,
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

-- 2. Индексы и ограничения для UPSERT
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_number_idx ON public.users (phone_number);
CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_idx ON public.users (telegram_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "Public access to upsert users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Политика: разрешаем анонимный и авторизованный UPSERT (для входа по телефону/ТГ)
CREATE POLICY "Public access to upsert users" 
ON public.users 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 5. Обновляем кэш PostgREST
NOTIFY pgrst, 'reload schema';