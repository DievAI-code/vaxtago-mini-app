-- Таблица для кэширования вакансий из разных источников
CREATE TABLE IF NOT EXISTS jobs_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    source text NOT NULL, -- 'hh' или 'trudvsem'
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

-- Создаем GIN индекс для полнотекстового поиска по названиям
CREATE INDEX IF NOT EXISTS idx_jobs_cache_search ON jobs_cache USING gin (to_tsvector('russian', title));