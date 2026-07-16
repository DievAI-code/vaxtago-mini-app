-- Ensure translation-related columns exist on telegram_users
ALTER TABLE telegram_users
  ADD COLUMN IF NOT EXISTS last_ocr_text text,
  ADD COLUMN IF NOT EXISTS translation_state text,
  ADD COLUMN IF NOT EXISTS last_translation text;