-- Добавляем недостающие колонки в таблицу users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_login timestamptz,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS language_code text DEFAULT 'uz',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free';

-- Добавляем/проверяем UNIQUE constraint на phone_number
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' AND constraint_name = 'users_phone_number_key'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);
    END IF;
END $$;

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