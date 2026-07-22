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
        .select("subscription_status, subscription_expires, ai_requests_used")
        .eq("phone_number", userPhone)
        .single();

      if (error) {
        console.error("Subscription check error:", error);
        return this.getFreeTierInfo();
      }

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
              "priority_support"
            ]
          };
        }
      }

      return this.getFreeTierInfo();

    } catch (error) {
      console.error("Subscription service error:", error);
      return this.getFreeTierInfo();
    }
  },

  getFreeTierInfo(): SubscriptionInfo {
    return {
      status: 'free',
      remaining_requests: 10, // Лимит для бесплатного тарифа
      features: [
        "basic_ai",
        "limited_translations",
        "job_search"
      ]
    };
  },

  async canUseFeature(feature: string): Promise<boolean> {
    const subscription = await this.checkSubscription();
    
    if (subscription.status === 'premium') {
      return true;
    }

    // Проверяем лимиты для бесплатного тарифа
    if (feature === 'ai_request') {
      return (subscription.remaining_requests || 0) > 0;
    }

    return false;
  },

  async decrementRequestCount(): Promise<void> {
    const userPhone = localStorage.getItem("vaxtago_user_phone");
    if (!userPhone) return;

    try {
      await supabase.rpc('decrement_ai_requests', {
        user_phone: userPhone
      });
    } catch (error) {
      console.error("Failed to decrement request count:", error);
    }
  }
};