"use client";

import { supabase } from "@/integrations/supabase/client";
import { normalizePhone } from "@/lib/normalizePhone";

export interface User {
  id: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  role?: string;
  subscription_status: "free" | "premium" | "trial";
  subscription_expires_at?: string | null;
  premium_started_at?: string | null;
  ai_requests_used?: number;
  ai_requests_limit?: number;
  ocr_requests_used?: number;
  ocr_requests_used_limit?: number;
  map_requests_used?: number;
  job_searches_used?: number;
  last_limit_reset?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

export interface PremiumCheckResult {
  isPremium: boolean;
  allowed: boolean;
  remaining: number | Infinity;
  expired: boolean;
}

/**
 * Найти пользователя по номеру телефона.
 * Возвращает null если не найден (без ошибки).
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone_number", cleanPhone)
      .maybeSingle();

    if (error) {
      console.warn("[userService] getUserByPhone error:", error.message);
      return null;
    }

    return (data as User) || null;
  } catch (err) {
    console.warn("[userService] getUserByPhone exception:", err);
    return null;
  }
}

/**
 * Создать нового пользователя с дефолтными значениями.
 */
export async function createUser(phone: string): Promise<User | null> {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || !supabase) return null;

  try {
    const { data, error } = await supabase
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
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn("[userService] createUser error:", error.message);
      return null;
    }

    return (data as User) || null;
  } catch (err) {
    console.warn("[userService] createUser exception:", err);
    return null;
  }
}

/**
 * Найти или создать пользователя.
 */
export async function findOrCreateUser(phone: string): Promise<User | null> {
  const existing = await getUserByPhone(phone);
  if (existing) return existing;
  return await createUser(phone);
}

/**
 * Обновить подписку пользователя.
 */
export async function updateUserSubscription(
  userId: string,
  data: {
    subscription_status?: "free" | "premium" | "trial";
    subscription_expires_at?: string | null;
    premium_started_at?: string | null;
    ai_requests_limit?: number;
  }
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("users")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.warn("[userService] updateUserSubscription error:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("[userService] updateUserSubscription exception:", err);
    return false;
  }
}

/**
 * Проверить Premium доступ пользователя.
 *
 * Логика:
 * - Если subscription_status = premium и subscription_expires_at > сейчас → доступ разрешён.
 * - Если subscription_expires_at не указан → считаем бессрочным.
 * - Если premium истёк → доступ запрещён, нужен апгрейд.
 * - Если subscription_status = free → используем лимиты.
 */
export function checkPremiumAccess(user: User | null): PremiumCheckResult {
  if (!user) {
    return { isPremium: false, allowed: false, remaining: 0, expired: false };
  }

  if (user.subscription_status === "premium") {
    if (user.subscription_expires_at) {
      const expiry = new Date(user.subscription_expires_at);
      if (expiry <= new Date()) {
        return { isPremium: false, allowed: false, remaining: 0, expired: true };
      }
    }
    return { isPremium: true, allowed: true, remaining: Infinity, expired: false };
  }

  return { isPremium: false, allowed: false, remaining: 0, expired: false };
}

/**
 * Обновить last_login при входе.
 */
export async function updateLastLogin(phone: string): Promise<void> {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || !supabase) return;

  try {
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("phone_number", cleanPhone);
  } catch (err) {
    console.warn("[userService] updateLastLogin exception:", err);
  }
}