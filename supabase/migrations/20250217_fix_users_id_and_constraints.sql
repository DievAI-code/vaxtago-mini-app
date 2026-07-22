-- Проверяем и исправляем структуру таблицы users
DO $$ 
BEGIN
    -- Добавляем колонку id если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'id') THEN
        ALTER TABLE public.users ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;
    END IF;

    -- Проверяем тип колонки id
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'id' 
              AND data_type != 'uuid') THEN
        -- Создаем временную таблицу для миграции
        CREATE TABLE public.users_new (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            phone_number text NOT NULL,
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
        
        -- Копируем данные
        INSERT INTO public.users_new (phone_number, language_code, last_login, updated_at, subscription_status, first_name, last_name, username, avatar_url, country, city, created_at)
        SELECT phone_number, language_code, last_login, updated_at, subscription_status, first_name, last_name, username, avatar_url, country, city, created_at
        FROM public.users;
        
        -- Удаляем старую таблицу
        DROP TABLE public.users;
        
        -- Переименовываем новую таблицу
        ALTER TABLE public.users_new RENAME TO users;
    END IF;

    -- Добавляем UNIQUE constraint на phone_number если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE table_name = 'users' AND constraint_name = 'users_phone_number_key') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);
    END IF;

    -- Добавляем NOT NULL constraint на phone_number если его нет
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'phone_number' 
              AND is_nullable = 'YES') THEN
        -- Сначала удаляем возможные NULL значения
        DELETE FROM public.users WHERE phone_number IS NULL;
        -- Затем добавляем NOT NULL
        ALTER TABLE public.users ALTER COLUMN phone_number SET NOT NULL;
    END IF;

END $$;

-- Создаем индекс для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Обновляем триггер для updated_at
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

-- Даем права на таблицу
GRANT ALL ON public.users TO anon, authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO anon, authenticated;