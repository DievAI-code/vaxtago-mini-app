"use client";

import { supabase } from "@/integrations/supabase/client";

export const subscriptionService = {
  async checkPremium(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("subscriptions")
      .select("plan, status, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) return false;
    if (data.plan === "premium" && data.status === "active") {
      if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
      return true;
    }
    return false;
  },

  async getRemainingUsage(feature: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count } = await supabase
      .from("ai_usage")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .eq("feature", feature);

    const LIMITS: Record<string, number> = { chat: 10, vision: 3 };
    return Math.max(0, (LIMITS[feature] || 0) - (count || 0));
  }
};