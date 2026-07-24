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
  ai_requests_used?: number;
  map_requests_used?: number;
  ocr_requests_used?: number;
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

export async function createUser(phone: string): Promise<User | null> {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from("users")
      .insert({
        phone_number: cleanPhone,
        subscription_status: "free",
        ai_requests_used: 0,
        map_requests_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        language_code: "ru",
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

export async function findOrCreateUser(phone: string): Promise<User | null> {
  const existing = await getUserByPhone(phone);
  if (existing) return existing;
  return await createUser(phone);
}

export async function updateUserSubscription(
  userId: string,
  data: {
    subscription_status?: "free" | "premium" | "trial";
    subscription_expires_at?: string | null;
  }
): Promise<boolean> {
  if (!supabase) return false;

  // Only include confirmed columns to prevent 400 errors
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (data.subscription_status !== undefined) {
    updateData.subscription_status = data.subscription_status;
  }
  if (data.subscription_expires_at !== undefined) {
    updateData.subscription_expires_at = data.subscription_expires_at;
  }

  try {
    const { error } = await supabase
      .from("users")
      .update(updateData)
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

export async function updateLastLogin(phone: string): Promise<void> {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || !supabase) return;

  try {
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("phone_number", cleanPhone);
  } catch {}
}