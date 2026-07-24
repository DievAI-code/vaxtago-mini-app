import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';
import { normalizePhone } from '@/lib/normalizePhone';

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
      },
    },
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
    status: error?.status,
  });
};

/**
 * Безопасный вход: найти пользователя, если нет — создать.
 * Не вызывает ошибку 400 если пользователь отсутствует.
 */
export const safeSupabaseLogin = async (phone: string, extraData: Record<string, any> = {}) => {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client not initialized");

  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) throw new Error("Invalid phone number");

  try {
    // Шаг 1: Попытаться найти пользователя
    const { data: existing, error: selectErr } = await client
      .from("users")
      .select("*")
      .eq("phone_number", cleanPhone)
      .maybeSingle();

    if (selectErr) {
      console.warn("[Supabase Login] Select error:", selectErr.message);
    }

    if (existing) {
      // Обновить last_login
      await client
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          language_code: extraData.language_code || existing.language_code || "ru",
        })
        .eq("phone_number", cleanPhone);

      return { data: existing, error: null };
    }

    // Шаг 2: Создать нового пользователя
    const { data: newUser, error: insertErr } = await client
      .from("users")
      .insert({
        phone_number: cleanPhone,
        role: "user",
        subscription_status: "free",
        ai_requests_used: 0,
        ai_requests_limit: 10,
        ocr_requests_used: 0,
        map_requests_used: 0,
        job_searches_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        language_code: extraData.language_code || "ru",
      })
      .select()
      .maybeSingle();

    if (insertErr) {
      // Возможно, пользователь уже был создан параллельно — попробуем ещё раз
      const { data: fallback, error: fallbackErr } = await client
        .from("users")
        .select("*")
        .eq("phone_number", cleanPhone)
        .maybeSingle();

      if (fallback) return { data: fallback, error: null };
      return { data: null, error: insertErr };
    }

    return { data: newUser, error: null };
  } catch (err: any) {
    console.error("[Supabase Login] Exception:", err);
    return { data: null, error: err };
  }
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