import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';

// Singleton клиент с защитой от повторного создания
let supabaseInstance: any = null;

export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;
  
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  
  if (!url || !key) {
    console.error('[Supabase] Missing URL or ANON_KEY');
    return null;
  }

  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      }
    }
  });

  return supabaseInstance;
};

export const supabase = getSupabaseClient();

// Функция для очистки проблемной сессии
export const clearSupabaseSession = async () => {
  if (supabase) {
    await supabase.auth.signOut();
    localStorage.removeItem('supabase.auth.token');
  }
};

// Расширенное логирование ошибок Supabase
export const logSupabaseError = (error: any, context: string = '') => {
  console.error(`[Supabase Error] ${context}`, {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    status: error?.status
  });
};

// Функция для получения полной информации об ошибке
export const getSupabaseErrorInfo = (error: any) => {
  return {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
    fullError: error
  };
};

// Проверка подключения
export const checkSupabaseConnection = async () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      logSupabaseError(error, 'Connection Test');
      return false;
    }
    
    console.log('[Supabase Connection Test] Success:', data);
    return true;
  } catch (err) {
    console.error('[Supabase Connection Test] Failed:', err);
    return false;
  }
};