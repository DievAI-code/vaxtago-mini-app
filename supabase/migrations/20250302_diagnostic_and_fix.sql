-- Ensure app_settings exists
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    premium_mode TEXT NOT NULL DEFAULT 'off',
    ai_limit_free INTEGER NOT NULL DEFAULT 10,
    ocr_limit_free INTEGER NOT NULL DEFAULT 5,
    map_limit_free INTEGER NOT NULL DEFAULT 5,
    jobs_limit_free INTEGER NOT NULL DEFAULT 5,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reset RLS for app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_app_settings" ON public.app_settings;
CREATE POLICY "public_read_app_settings" ON public.app_settings FOR SELECT USING (true);

-- Ensure users table has correct columns
DO $$
BEGIN
    -- Check phone_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone_number') THEN
        ALTER TABLE public.users ADD COLUMN phone_number TEXT UNIQUE;
    END IF;
    
    -- Check limit tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ai_requests_used') THEN
        ALTER TABLE public.users ADD COLUMN ai_requests_used INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_limit_reset') THEN
        ALTER TABLE public.users ADD COLUMN last_limit_reset TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Fix RLS for users to allow upsert by phone_number
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable_all_for_users" ON public.users;
CREATE POLICY "enable_all_for_users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Grant permissions for API access
GRANT ALL ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- Ensure default settings row
INSERT INTO public.app_settings (id, premium_mode) VALUES ('default', 'off') ON CONFLICT (id) DO NOTHING;