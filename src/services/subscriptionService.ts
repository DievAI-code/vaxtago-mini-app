"use client";

import { supabase } from "@/integrations/supabase/client";

export const subscriptionService = {
  async getStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "free";

    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) return "free";
    
    // Проверка срока годности
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return "free";
    }

    return data.plan; // 'free' | 'premium'
  },

  async canUseFeature(feature: string): Promise<boolean> {
    const plan = await this.getStatus();
    if (plan === "premium") return true;

    // Лимиты для FREE
    const { count } = await supabase
      .from("ai_usage")
      .select("*", { count: 'exact', head: true })
      .eq("feature", feature);

    const LIMITS: Record<string, number> = {
      'chat': 10,
      'vision': 3,
      'map_extra': 0
    };

    return (count || 0) < (LIMITS[feature] || 0);
  }
};