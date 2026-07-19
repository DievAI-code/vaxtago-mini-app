// Этот файл сгенерирован автоматически. Не редактируйте его напрямую.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://watkanjjfsvqbhebchpk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdGthbmpqZnN2cWJoZWJjaHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODk5MTYsImV4cCI6MjA5OTI2NTkxNn0.VGXIRn1EpJvLmW-ZvgT4JSMuSaQVszh9YzjmkFOOANY";

// Импортируйте supabase клиент так:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
