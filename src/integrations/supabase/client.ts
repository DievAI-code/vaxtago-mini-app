import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';

const url = getSupabaseUrl();
const key = getSupabaseAnonKey();

// Создаем клиент только если есть валидные данные, иначе возвращаем прокси-заглушку для предотвращения крэша
export const supabase = url && key 
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : (null as any);

export const checkSupabaseConnection = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Please check your environment variables.");
  }
};