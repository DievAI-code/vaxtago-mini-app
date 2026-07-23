"use client";

import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionInfo {
  status: 'free' | 'premium' | 'trial';
  expires_at?: string;
  remaining_requests?: number;
  features: string[];
}

export const subscriptionService = {
  async checkSubscription(): Promise<SubscriptionInfo> {
    try {
      const userPhone = localStorage.getItem("vaxtago_user_phone");
      if (!userPhone) {
        return this.getFreeTierInfo();
      }

      const { data, error } = await supabase
        .from("users")
        .select("subscription_status, subscription_expires, ai_requests_used, ai_requests_reset_at")
        .eq("phone_number", userPhone)
        .single();

      if (error) {
        console.error("Subscription check error:", error);
        return this.getFreeTierInfo();
      }

      // Проверка на необходимость сброса дневного лимита (если прошло более 24 часов)
      const lastReset = new Date(data.ai_requests_reset_at || 0);
      const now = new Date();
      const needsReset = (now.getTime() - lastReset.getTime()) > 24 * 60 * 60 * 1000;

      let currentUsed = needsReset ? 0 : (data.ai_requests_used || 0);

      if (data?.subscription_status === 'premium') {
        const isActive = !data.subscription_expires || new Date(data.subscription_expires) > new Date();
        
        if (isActive) {
          return {
            status: 'premium',
            expires_at: data.subscription_expires,
            features: [
              "unlimited_ai",
              "document_analysis", 
              "employer_checks",
              "priority_support",
              "map_routes"
            ]
          };
        }
      }

      return {
        ...this.getFreeTierInfo(),
        remaining_requests: Math.max(0, 10 - currentUsed)
      };

    } catch (error) {
      console.error("Subscription service error:", error);
      return this.getFreeTierInfo();
    }
  },

  getFreeTierInfo(): SubscriptionInfo {
    return {
      status: 'free',
      remaining_requests: 10,
      features: [
        "basic_ai",
        "limited_translations",
        "job_search"
      ]
    };
  },

  async canUseFeature(feature: string): Promise<boolean> {
    const info = await this.checkSubscription();
    
    if (info.status === 'premium') {
      return true;
    }

    if (feature === 'ai_request' || feature === 'vision') {
      return (info.remaining_requests || 0) > 0;
    }

    return false;
  },

  async decrementRequestCount(): Promise<void> {
    const userPhone = localStorage.getItem("vaxtago_user_phone");
    if (!userPhone) return;

    try {
      // Используем RPC или прямой апдейт
      const { data: user } = await supabase
        .from("users")
        .select("ai_requests_used")
        .eq("phone_number", userPhone)
        .single();

      await supabase
        .from("users")
        .update({ 
          ai_requests_used: (user?.ai_requests_used || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("phone_number", userPhone);
        
    } catch (error) {
      console.error("Failed to decrement request count:", error);
    }
  }
};