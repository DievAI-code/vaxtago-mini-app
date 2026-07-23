-- Проверяем и исправляем ограничения таблицы users
DO $$ 
BEGIN
    -- 1. Проверяем наличие UNIQUE constraint на phone_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE table_name = 'users' AND constraint_name = 'users_phone_number_key') THEN
        -- Сначала удаляем возможные дубликаты
        DELETE FROM users 
        WHERE ctid NOT IN (
            SELECT min(ctid) 
            FROM users 
            WHERE phone_number IS NOT NULL
            GROUP BY phone_number
        );
        
        -- Затем добавляем UNIQUE constraint
        ALTER TABLE users ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);
        RAISE NOTICE 'Added UNIQUE constraint on phone_number';
    END IF;

    -- 2. Проверяем PRIMARY KEY
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE table_name = 'users' AND constraint_type = 'PRIMARY KEY') THEN
        -- Добавляем PRIMARY KEY если отсутствует
        ALTER TABLE users ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
        ALTER TABLE users ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added PRIMARY KEY';
    END IF;

    -- 3. Проверяем NOT NULL constraints
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'phone_number' 
              AND is_nullable = 'YES') THEN
        -- Удаляем записи с NULL phone_number
        DELETE FROM users WHERE phone_number IS NULL;
        -- Добавляем NOT NULL
        ALTER TABLE users ALTER COLUMN phone_number SET NOT NULL;
        RAISE NOTICE 'Added NOT NULL constraint on phone_number';
    END IF;

    -- 4. Проверяем значения по умолчанию
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'subscription_status' 
                  AND column_default IS NOT NULL) THEN
        ALTER TABLE users ALTER COLUMN subscription_status SET DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'language_code' 
                  AND column_default IS NOT NULL) THEN
        ALTER TABLE users ALTER COLUMN language_code SET DEFAULT 'uz';
    END IF;

END $$;

-- Создаем/обновляем индексы
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Обновляем статистику
ANALYZE users;