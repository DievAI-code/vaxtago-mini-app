"use client";

import { supabase } from "@/integrations/supabase/client";

export interface UsageInfo {
  status: 'free' | 'premium';
  ai_remaining: number;
  ocr_remaining: number;
  map_remaining: number;
}

const LIMITS = {
  free: { ai: 10, ocr: 5, map: 5 },
  premium: { ai: Infinity, ocr: Infinity, map: Infinity }
};

export const subscriptionService = {
  async getUsage(): Promise<UsageInfo> {
    const userPhone = localStorage.getItem("vaxtago_user_phone");
    if (!userPhone) return { status: 'free', ai_remaining: 0, ocr_remaining: 0, map_remaining: 0 };

    try {
      const { data, error } = await supabase
        .from("users")
        .select("subscription_status, ai_requests_used, ocr_requests_used, map_requests_used, last_limit_reset")
        .eq("phone_number", userPhone)
        .single();

      if (error) throw error;

      // Проверка на сброс лимитов (раз в сутки)
      const lastReset = new Date(data.last_limit_reset || 0);
      const now = new Date();
      const needsReset = (now.getTime() - lastReset.getTime()) > 24 * 60 * 60 * 1000;

      const status = (data.subscription_status || 'free') as 'free' | 'premium';
      const currentLimits = LIMITS[status];

      if (needsReset) {
        await supabase
          .from("users")
          .update({
            ai_requests_used: 0,
            ocr_requests_used: 0,
            map_requests_used: 0,
            last_limit_reset: now.toISOString()
          })
          .eq("phone_number", userPhone);
        
        return { status, ai_remaining: currentLimits.ai, ocr_remaining: currentLimits.ocr, map_remaining: currentLimits.map };
      }

      return {
        status,
        ai_remaining: Math.max(0, currentLimits.ai - (data.ai_requests_used || 0)),
        ocr_remaining: Math.max(0, currentLimits.ocr - (data.ocr_requests_used || 0)),
        map_remaining: Math.max(0, currentLimits.map - (data.map_requests_used || 0))
      };
    } catch (e) {
      return { status: 'free', ai_remaining: 0, ocr_remaining: 0, map_remaining: 0 };
    }
  },

  async canUse(feature: 'ai' | 'ocr' | 'map'): Promise<boolean> {
    const usage = await this.getUsage();
    if (usage.status === 'premium') return true;
    
    if (feature === 'ai') return usage.ai_remaining > 0;
    if (feature === 'ocr') return usage.ocr_remaining > 0;
    if (feature === 'map') return usage.map_remaining > 0;
    return false;
  },

  async trackUsage(feature: 'ai' | 'ocr' | 'map') {
    const userPhone = localStorage.getItem("vaxtago_user_phone");
    if (!userPhone) return;

    const column = `${feature}_requests_used`;
    const { data: user } = await supabase.from("users").select(column).eq("phone_number", userPhone).single();
    
    await supabase
      .from("users")
      .update({ [column]: (user?.[column] || 0) + 1 })
      .eq("phone_number", userPhone);
  }
};