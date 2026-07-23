-- Фикс таблицы пользователей
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS map_requests_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS map_requests_limit integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS last_geo_query timestamp with time zone;

-- Таблица истории OCR (если отсутствовала)
CREATE TABLE IF NOT EXISTS ocr_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    image_url text,
    original_text text,
    translated_text text,
    created_at timestamp with time zone DEFAULT now()
);

-- Индексы для ускорения поиска
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_ocr_user ON ocr_history(user_id);