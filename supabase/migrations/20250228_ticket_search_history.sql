-- Ticket Search History Table
CREATE TABLE IF NOT EXISTS ticket_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  from_city TEXT,
  to_city TEXT,
  transport_type TEXT NOT NULL CHECK (transport_type IN ('train', 'flight', 'bus')),
  search_query TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast user lookups
  CONSTRAINT idx_ticket_search_user_id FOREIGN KEY (user_id) REFERENCES users(phone_number)
);

-- Index for recent searches
CREATE INDEX IF NOT EXISTS idx_ticket_search_created_at ON ticket_search_history(created_at DESC);

-- Row Level Security policies
ALTER TABLE ticket_search_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own search history
CREATE POLICY "Users can view own ticket history"
  ON ticket_search_history FOR SELECT
  USING (user_id = auth.uid()::text);

-- Users can only insert their own searches
CREATE POLICY "Users can insert own ticket searches"
  ON ticket_search_history FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Add comment
COMMENT ON TABLE ticket_search_history IS 'Stores user ticket search history for personalization';