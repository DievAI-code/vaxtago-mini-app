-- 1. Create app_settings table in public schema
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    premium_mode TEXT NOT NULL DEFAULT 'off',
    ai_limit_free INTEGER NOT NULL DEFAULT 10,
    ocr_limit_free INTEGER NOT NULL DEFAULT 5,
    map_limit_free INTEGER NOT NULL DEFAULT 5,
    jobs_limit_free INTEGER NOT NULL DEFAULT 5,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and set policies for app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to app_settings for all" ON public.app_settings;
CREATE POLICY "Allow read access to app_settings for all"
    ON public.app_settings FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow write access to app_settings for all" ON public.app_settings;
CREATE POLICY "Allow write access to app_settings for all"
    ON public.app_settings FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon, authenticated;

-- Insert default row if empty
INSERT INTO public.app_settings (id, premium_mode, ai_limit_free, ocr_limit_free, map_limit_free, jobs_limit_free)
VALUES ('default', 'off', 10, 5, 5, 5)
ON CONFLICT (id) DO NOTHING;


-- 2. Ensure public.users table exists with proper structure and phone_number column
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT UNIQUE,
    telegram_id BIGINT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    language_code TEXT DEFAULT 'ru',
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    subscription_status TEXT DEFAULT 'free',
    subscription_expires TIMESTAMPTZ,
    is_premium BOOLEAN DEFAULT false,
    premium_until TIMESTAMPTZ,
    ai_requests_used INTEGER DEFAULT 0,
    ocr_requests_used INTEGER DEFAULT 0,
    map_requests_used INTEGER DEFAULT 0,
    job_searches_used INTEGER DEFAULT 0,
    last_limit_reset TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add any missing columns safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='phone_number') THEN
        ALTER TABLE public.users ADD COLUMN phone_number TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='is_premium') THEN
        ALTER TABLE public.users ADD COLUMN is_premium BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='premium_until') THEN
        ALTER TABLE public.users ADD COLUMN premium_until TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='ai_requests_used') THEN
        ALTER TABLE public.users ADD COLUMN ai_requests_used INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='ocr_requests_used') THEN
        ALTER TABLE public.users ADD COLUMN ocr_requests_used INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='map_requests_used') THEN
        ALTER TABLE public.users ADD COLUMN map_requests_used INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='job_searches_used') THEN
        ALTER TABLE public.users ADD COLUMN job_searches_used INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='last_limit_reset') THEN
        ALTER TABLE public.users ADD COLUMN last_limit_reset TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Enable RLS and set policies for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.users;
CREATE POLICY "Allow select for all"
    ON public.users FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON public.users;
CREATE POLICY "Allow insert for all"
    ON public.users FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all" ON public.users;
CREATE POLICY "Allow update for all"
    ON public.users FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated;