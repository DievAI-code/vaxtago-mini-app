-- OCR Translation History Table
CREATE TABLE IF NOT EXISTS ocr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  original_image TEXT,
  translated_image TEXT,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  recognized_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ocr_history_user_id ON ocr_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_history_created_at ON ocr_history(created_at DESC);

ALTER TABLE ocr_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OCR history"
  ON ocr_history FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own OCR history"
  ON ocr_history FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own OCR history"
  ON ocr_history FOR DELETE
  USING (user_id = auth.uid()::text);

COMMENT ON TABLE ocr_history IS 'Stores user OCR translation history';