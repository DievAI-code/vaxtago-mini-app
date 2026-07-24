"use client";

import { supabase } from "@/integrations/supabase/client";
import { normalizePhone } from "@/lib/normalizePhone";
import { getUserByPhone, checkPremiumAccess, User } from "./userService";

export type FeatureType = "ai" | "ocr" | "maps" | "routes" | "jobs";
export type PremiumMode = "off" | "selected" | "all";

export interface AppSettings {
  id: string;
  premium_mode: PremiumMode;
  ai_limit_free: number;
  ocr_limit_free: number;
  map_limit_free: number;
  jobs_limit_free: number;
  updated_at: string;
}

export interface AccessResult {
  allowed: boolean;
  isPremium: boolean;
  remaining: number;
  mode: PremiumMode;
  message?: string;
}

let cachedSettings: AppSettings | null = null;
let lastSettingsFetch = 0;
const CACHE_TTL_MS = 15000;

export const subscription = {
  async getSettings(forceRefresh = false): Promise<AppSettings> {
    const now = Date.now();
    if (!forceRefresh && cachedSettings && now - lastSettingsFetch < CACHE_TTL_MS) {
      return cachedSettings;
    }

    const defaultSettings: AppSettings = {
      id: "default",
      premium_mode: "off",
      ai_limit_free: 10,
      ocr_limit_free: 5,
      map_limit_free: 5,
      jobs_limit_free: 5,
      updated_at: new Date().toISOString(),
    };

    try {
      if (!supabase) return defaultSettings;

      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return defaultSettings;
      }

      cachedSettings = data as AppSettings;
      lastSettingsFetch = now;
      return cachedSettings;
    } catch (e) {
      console.warn("[Subscription] app_settings query fallback:", e);
      return defaultSettings;
    }
  },

  async checkUserAccess(feature: FeatureType): Promise<AccessResult> {
    const settings = await this.getSettings();
    const mode = settings.premium_mode;

    if (mode === "all") {
      return { allowed: true, isPremium: true, remaining: Infinity, mode: "all" };
    }

    const rawPhone = localStorage.getItem("vaxtago_user_phone");
    if (!rawPhone) {
      return { allowed: true, isPremium: false, remaining: 5, mode };
    }

    const user = await getUserByPhone(rawPhone);

    if (!user) {
      return { allowed: true, isPremium: false, remaining: 5, mode };
    }

    const premiumCheck = checkPremiumAccess(user);

    if (mode === "selected" && premiumCheck.isPremium) {
      return { allowed: true, isPremium: true, remaining: Infinity, mode: "selected" };
    }

    if (premiumCheck.isPremium) {
      return { allowed: true, isPremium: true, remaining: Infinity, mode };
    }

    if (premiumCheck.expired) {
      await supabase
        .from("users")
        .update({ subscription_status: "free", updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    const lastReset = new Date(user.last_limit_reset || 0);
    const todayStr = new Date().toDateString();

    if (lastReset.toDateString() !== todayStr) {
      await supabase
        .from("users")
        .update({
          ai_requests_used: 0,
          ocr_requests_used: 0,
          map_requests_used: 0,
          job_searches_used: 0,
          last_limit_reset: new Date().toISOString(),
        })
        .eq("id", user.id);

      user.ai_requests_used = 0;
      user.ocr_requests_used = 0;
      user.map_requests_used = 0;
      user.job_searches_used = 0;
    }

    let used = 0;
    let limit = 5;

    switch (feature) {
      case "ai":
        used = user.ai_requests_used || 0;
        limit = settings.ai_limit_free;
        break;
      case "ocr":
        used = user.ocr_requests_used || 0;
        limit = settings.ocr_limit_free;
        break;
      case "maps":
      case "routes":
        used = user.map_requests_used || 0;
        limit = settings.map_limit_free;
        break;
      case "jobs":
        used = user.job_searches_used || 0;
        limit = settings.jobs_limit_free;
        break;
    }

    const remaining = Math.max(0, limit - used);
    return {
      allowed: remaining > 0,
      isPremium: false,
      remaining,
      mode,
    };
  },

  async trackUsage(feature: FeatureType): Promise<void> {
    const rawPhone = localStorage.getItem("vaxtago_user_phone");
    if (!rawPhone || !supabase) return;

    const phone = normalizePhone(rawPhone);
    if (!phone) return;

    const columnMap: Record<FeatureType, string> = {
      ai: "ai_requests_used",
      ocr: "ocr_requests_used",
      maps: "map_requests_used",
      routes: "map_requests_used",
      jobs: "job_searches_used",
    };

    const col = columnMap[feature];

    try {
      const { data: user } = await supabase
        .from("users")
        .select(col)
        .eq("phone_number", phone)
        .maybeSingle();

      const currentUsed = user ? user[col] || 0 : 0;

      await supabase
        .from("users")
        .update({
          [col]: currentUsed + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("phone_number", phone);
    } catch (e) {
      console.warn("[Subscription] Track usage error:", e);
    }
  },

  async updateSettings(newSettings: Partial<AppSettings>, actionLogMessage: string): Promise<boolean> {
    try {
      if (!supabase) return false;
      const current = await this.getSettings(true);
      const { error } = await supabase
        .from("app_settings")
        .update({
          ...newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", current.id);

      if (error) throw error;

      cachedSettings = null;

      await supabase.from("admin_logs").insert({
        action: actionLogMessage,
        details: JSON.stringify(newSettings),
      });

      return true;
    } catch (err) {
      console.error("[Subscription] Update settings error:", err);
      return false;
    }
  },
};