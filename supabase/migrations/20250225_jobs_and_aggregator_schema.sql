-- Таблица кэша вакансий для оптимизации запросов к внешним API
CREATE TABLE IF NOT EXISTS jobs_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    source text NOT NULL, -- 'hh'
    external_id text NOT NULL,
    title text NOT NULL,
    company text,
    salary text,
    city text,
    description text,
    url text UNIQUE,
    schedule text,
    created_at timestamp with time zone DEFAULT now()
);

-- Обновление таблицы пользователей для учета лимитов поиска работы
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS job_searches_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS job_searches_reset_at timestamp with time zone DEFAULT now();

-- Индексы для ускорения поиска по кэшу
CREATE INDEX IF NOT EXISTS idx_jobs_cache_title ON jobs_cache USING gin (to_tsvector('russian', title));
CREATE INDEX IF NOT EXISTS idx_jobs_cache_city ON jobs_cache(city);