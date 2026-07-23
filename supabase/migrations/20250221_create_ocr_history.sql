-- Таблица истории OCR и переводов фото
CREATE TABLE IF NOT EXISTS ocr_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT, -- Ссылка на storage или краткое описание
  original_text TEXT,
  translated_text TEXT,
  target_language TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для контроля лимитов
CREATE INDEX IF NOT EXISTS idx_ocr_history_user_date ON ocr_history(user_id, created_at);

-- RLS
ALTER TABLE ocr_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own OCR history"
ON ocr_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OCR history"
ON ocr_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);