import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';
import { normalizePhone } from '@/lib/normalizePhone';

// Singleton клиент
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

export const clearSupabaseSession = async () => {
  if (supabase) {
    await supabase.auth.signOut();
    localStorage.removeItem('supabase.auth.token');
  }
};

export const logSupabaseError = (error: any, context: string = '') => {
  console.error(`[Supabase Error] ${context}`, {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    status: error?.status
  });
};

/**
 * Безопасный upsert пользователя с повторными попытками и фоллбэком
 */
export const safeSupabaseUpsertUser = async (phone: string, extraData: Record<string, any> = {}) => {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client not initialized");

  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) throw new Error("Invalid phone number");

  const maxAttempts = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await client
        .from("users")
        .upsert(
          {
            phone_number: cleanPhone,
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            subscription_status: 'free',
            language_code: extraData.language_code || 'ru',
            ...extraData
          },
          {
            onConflict: 'phone_number',
            ignoreDuplicates: false
          }
        )
        .select()
        .maybeSingle();

      if (!response.error) {
        return { data: response.data, error: null };
      }

      lastError = response.error;
      console.warn(`[Supabase Login Attempt ${attempt}/${maxAttempts}] Temporary issue:`, response.error.message || response.error);

      if (attempt < maxAttempts) {
        await new Promise((res) => setTimeout(res, 800 * attempt));
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Supabase Login Attempt ${attempt}/${maxAttempts}] Network exception:`, err?.message || err);
      if (attempt < maxAttempts) {
        await new Promise((res) => setTimeout(res, 800 * attempt));
      }
    }
  }

  // Фолбэк: пробуем получить существующую запись
  try {
    const { data: existingUser, error: selectErr } = await client
      .from("users")
      .select("*")
      .eq("phone_number", cleanPhone)
      .maybeSingle();

    if (existingUser && !selectErr) {
      await client
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("phone_number", cleanPhone);

      return { data: existingUser, error: null };
    }
  } catch (e) {
    console.error("[Supabase Login Fallback Error]:", e);
  }

  return { data: null, error: lastError };
};

export const checkSupabaseConnection = async () => {
  if (!supabase) return false;
  
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      logSupabaseError(error, 'Connection Test');
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase Connection Test] Failed:', err);
    return false;
  }
};