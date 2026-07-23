"use client";

import { supabase } from "@/integrations/supabase/client";

export interface UsageInfo {
  status: 'free' | 'premium';
  ai_remaining: number;
  ocr_remaining: number;
  map_remaining: number;
  expires_at?: string;
}

export const subscriptionService = {
  async getUsage(): Promise<UsageInfo> {
    const userPhone = localStorage.getItem("vaxtago_user_phone");
    if (!userPhone) return { status: 'free', ai_remaining: 0, ocr_remaining: 0, map_remaining: 0 };

    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          subscription_status, 
          subscription_expires_at,
          ai_requests_used, 
          ai_requests_limit,
          ocr_requests_used, 
          map_requests_used, 
          map_requests_limit,
          last_limit_reset
        `)
        .eq("phone_number", userPhone)
        .single();

      if (error) throw error;

      const now = new Date();
      const status = (data.subscription_status || 'free') as 'free' | 'premium';
      
      const lastReset = new Date(data.last_limit_reset || 0);
      const isNewDay = now.toDateString() !== lastReset.toDateString();

      if (isNewDay && status === 'free') {
        await supabase
          .from("users")
          .update({
            ai_requests_used: 0,
            ocr_requests_used: 0,
            map_requests_used: 0,
            last_limit_reset: now.toISOString()
          })
          .eq("phone_number", userPhone);
      }

      if (status === 'premium') {
        return { status: 'premium', ai_remaining: Infinity, ocr_remaining: Infinity, map_remaining: Infinity, expires_at: data.subscription_expires_at };
      }

      return {
        status: 'free',
        ai_remaining: Math.max(0, (data.ai_requests_limit || 10) - (data.ai_requests_used || 0)),
        ocr_remaining: Math.max(0, 5 - (data.ocr_requests_used || 0)),
        map_remaining: Math.max(0, (data.map_requests_limit || 3) - (data.map_requests_used || 0))
      };
    } catch (e) {
      console.error("[SubscriptionService] Error:", e);
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
      .update({ 
        [column]: (user?.[column] || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("phone_number", userPhone);
  }
};