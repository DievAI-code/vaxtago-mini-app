-- ============================================================
-- VaxtaGo Database Optimization Migration
-- Safe: uses IF NOT EXISTS / IF EXISTS, no table drops
-- ============================================================

-- 1. INDEXES (idempotent)
CREATE INDEX IF NOT EXISTS idx_assistant_messages_user_id ON assistant_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_created_at ON assistant_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_user_created ON assistant_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_channel ON assistant_messages(channel);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

CREATE INDEX IF NOT EXISTS idx_roadmap_items_user_id ON roadmap_items(user_id);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_sos_events_user_id ON sos_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_events_created_at ON sos_events(created_at);

CREATE INDEX IF NOT EXISTS idx_vacancies_employer_id ON vacancies(employer_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_created_at ON vacancies(created_at);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);

-- 2. CHECK CONSTRAINTS for assistant_messages
ALTER TABLE assistant_messages DROP CONSTRAINT IF EXISTS chk_assistant_messages_role;
ALTER TABLE assistant_messages ADD CONSTRAINT chk_assistant_messages_role
  CHECK (role IN ('user', 'assistant', 'system'));

ALTER TABLE assistant_messages DROP CONSTRAINT IF EXISTS chk_assistant_messages_channel;
ALTER TABLE assistant_messages ADD CONSTRAINT chk_assistant_messages_channel
  CHECK (channel IN ('telegram', 'app'));

-- 3. ENABLE RLS on user tables
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. CLEAN DUPLICATE POLICIES on assistant_messages (keep one per action)
DROP POLICY IF EXISTS "assistant_messages_select" ON assistant_messages;
DROP POLICY IF EXISTS "assistant_messages_insert" ON assistant_messages;
DROP POLICY IF EXISTS "assistant_messages_update" ON assistant_messages;
DROP POLICY IF EXISTS "assistant_messages_delete" ON assistant_messages;

-- 5. CREATE OPTIMIZED POLICIES using (select auth.uid())
CREATE POLICY "assistant_messages_select" ON assistant_messages
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "assistant_messages_insert" ON assistant_messages
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "assistant_messages_update" ON assistant_messages
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "assistant_messages_delete" ON assistant_messages
  FOR DELETE USING (user_id = (select auth.uid()));

-- Documents policies
DROP POLICY IF EXISTS "documents_select" ON documents;
DROP POLICY IF EXISTS "documents_insert" ON documents;
DROP POLICY IF EXISTS "documents_update" ON documents;
DROP POLICY IF EXISTS "documents_delete" ON documents;

CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "documents_insert" ON documents
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "documents_update" ON documents
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "documents_delete" ON documents
  FOR DELETE USING (user_id = (select auth.uid()));

-- Roadmap items
DROP POLICY IF EXISTS "roadmap_items_select" ON roadmap_items;
DROP POLICY IF EXISTS "roadmap_items_insert" ON roadmap_items;
DROP POLICY IF EXISTS "roadmap_items_update" ON roadmap_items;
DROP POLICY IF EXISTS "roadmap_items_delete" ON roadmap_items;

CREATE POLICY "roadmap_items_select" ON roadmap_items
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "roadmap_items_insert" ON roadmap_items
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "roadmap_items_update" ON roadmap_items
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "roadmap_items_delete" ON roadmap_items
  FOR DELETE USING (user_id = (select auth.uid()));

-- Alerts
DROP POLICY IF EXISTS "alerts_select" ON alerts;
DROP POLICY IF EXISTS "alerts_insert" ON alerts;
DROP POLICY IF EXISTS "alerts_update" ON alerts;
DROP POLICY IF EXISTS "alerts_delete" ON alerts;

CREATE POLICY "alerts_select" ON alerts
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "alerts_insert" ON alerts
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "alerts_update" ON alerts
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "alerts_delete" ON alerts
  FOR DELETE USING (user_id = (select auth.uid()));

-- SOS events
DROP POLICY IF EXISTS "sos_events_select" ON sos_events;
DROP POLICY IF EXISTS "sos_events_insert" ON sos_events;
DROP POLICY IF EXISTS "sos_events_update" ON sos_events;
DROP POLICY IF EXISTS "sos_events_delete" ON sos_events;

CREATE POLICY "sos_events_select" ON sos_events
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "sos_events_insert" ON sos_events
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "sos_events_update" ON sos_events
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "sos_events_delete" ON sos_events
  FOR DELETE USING (user_id = (select auth.uid()));

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (user_id = (select auth.uid()));

-- 6. FOREIGN KEYS (only if columns exist and FK missing)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_profiles_user'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT fk_profiles_user 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_documents_user'
  ) THEN
    ALTER TABLE documents ADD CONSTRAINT fk_documents_user 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assistant_messages' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_assistant_messages_user'
  ) THEN
    ALTER TABLE assistant_messages ADD CONSTRAINT fk_assistant_messages_user 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'alerts' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_alerts_user'
  ) THEN
    ALTER TABLE alerts ADD CONSTRAINT fk_alerts_user 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sos_events' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_sos_events_user'
  ) THEN
    ALTER TABLE sos_events ADD CONSTRAINT fk_sos_events_user 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vacancies' AND column_name = 'employer_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_vacancies_employer'
  ) THEN
    ALTER TABLE vacancies ADD CONSTRAINT fk_vacancies_employer 
      FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE SET NULL;
  END IF;
END
$$;