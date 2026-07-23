-- Таблица для хранения истории переписки с AI
CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  language TEXT DEFAULT 'ru',
  model_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого подсчета дневных лимитов
CREATE INDEX IF NOT EXISTS idx_assistant_messages_user_date ON assistant_messages(user_id, created_at);

-- RLS
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON assistant_messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
ON assistant_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);