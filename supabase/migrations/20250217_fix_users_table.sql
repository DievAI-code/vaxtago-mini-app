-- Создаем новую таблицу с правильной структурой
CREATE TABLE IF NOT EXISTS public.users_new (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number text NOT NULL UNIQUE,
    language_code text DEFAULT 'uz',
    last_login timestamptz,
    updated_at timestamptz DEFAULT now(),
    subscription_status text DEFAULT 'free',
    first_name text,
    last_name text,
    username text,
    avatar_url text,
    country text,
    city text,
    created_at timestamptz DEFAULT now()
);

-- Копируем данные из старой таблицы если она существует
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        INSERT INTO public.users_new (
            phone_number, language_code, last_login, updated_at, 
            subscription_status, first_name, last_name, username, 
            avatar_url, country, city, created_at
        )
        SELECT 
            COALESCE(phone_number, ''),
            COALESCE(language_code, 'uz'),
            last_login,
            COALESCE(updated_at, now()),
            COALESCE(subscription_status, 'free'),
            first_name,
            last_name,
            username,
            avatar_url,
            country,
            city,
            COALESCE(created_at, now())
        FROM public.users
        WHERE phone_number IS NOT NULL;
        
        -- Удаляем дубликаты
        DELETE FROM public.users_new 
        WHERE ctid NOT IN (
            SELECT min(ctid) 
            FROM public.users_new 
            GROUP BY phone_number
        );
        
        DROP TABLE public.users;
    END IF;
END $$;

-- Переименовываем новую таблицу
ALTER TABLE public.users_new RENAME TO users;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Права доступа
GRANT ALL ON public.users TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;