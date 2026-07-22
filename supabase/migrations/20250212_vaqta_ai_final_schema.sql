-- 1. Убеждаемся в существовании таблицы users и всех нужных колонок
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

-- Добавляем колонки точечно, если таблица уже была создана ранее без них
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'uz';

-- 2. Уникальный индекс для корректной работы UPSERT (on_conflict)
-- Удаляем старые индексы или констрейнты, если они мешают
DROP INDEX IF EXISTS users_phone_number_unique;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_number_idx ON public.users (phone_number);

-- 3. Настройка Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "Allow profile access" ON public.users;
DROP POLICY IF EXISTS "Public access to users" ON public.users;

-- Создаем политику: разрешаем любому (anon/auth) выполнять UPSERT по номеру телефона
CREATE POLICY "Public upsert access" 
ON public.users 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Перезагрузка кэша PostgREST (чтобы Supabase увидел новые колонки немедленно)
NOTIFY pgrst, 'reload schema';