-- Таблица для сбора заявок на поиск работы до запуска API
CREATE TABLE IF NOT EXISTS job_interest (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    profession text NOT NULL,
    city text,
    schedule text,
    created_at timestamp with time zone DEFAULT now()
);

-- Индекс для быстрого поиска по пользователю
CREATE INDEX IF NOT EXISTS idx_job_interest_user ON job_interest(user_id);