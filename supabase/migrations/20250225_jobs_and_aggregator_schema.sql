-- Таблица кэша вакансий
CREATE TABLE IF NOT EXISTS jobs_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    source text NOT NULL, -- 'hh' or 'trudvsem'
    external_id text NOT NULL,
    title text NOT NULL,
    company text,
    salary text,
    salary_min integer,
    city text,
    description text,
    url text UNIQUE,
    schedule text,
    housing boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Добавляем колонки лимитов поиска работы в таблицу пользователей
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS job_searches_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS job_searches_limit integer DEFAULT 5;

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs_cache(city);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs_cache(source);
CREATE INDEX IF NOT EXISTS idx_jobs_salary ON jobs_cache(salary_min);