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

export async function getUserByPhone(phone: string): Promise<User | null> {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, phone_number, first_name, language_code, role, subscription_status, subscription_expires_at, ai_requests_used, map_requests_used, created_at, last_login")
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        language_code: "ru",
      })
      .select("id, phone_number, first_name, language_code, role, subscription_status, subscription_expires_at, created_at, last_login")
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

export async function updateUserSubscription(
  userId: string,
  data: {
    subscription_status?: "free" | "premium" | "trial";
    subscription_expires_at?: string | null;
  }
): Promise<boolean> {
  if (!supabase) return false;

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (data.subscription_status !== undefined) updateData.subscription_status = data.subscription_status;
  if (data.subscription_expires_at !== undefined) updateData.subscription_expires_at = data.subscription_expires_at;

  try {
    const { error } = await supabase.from("users").update(updateData).eq("id", userId);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}

export function checkPremiumAccess(user: User | null): { isPremium: boolean; expired: boolean } {
  if (!user) return { isPremium: false, expired: false };
  if (user.subscription_status === "premium") {
    if (user.subscription_expires_at) {
      if (new Date(user.subscription_expires_at) <= new Date()) {
        return { isPremium: false, expired: true };
      }
    }
    return { isPremium: true, expired: false };
  }
  return { isPremium: false, expired: false };
}