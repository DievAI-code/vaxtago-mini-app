"use client";

export type FeatureType = "ai_chat" | "ocr_scan" | "map_search" | "job_search" | "translation";

interface UsageRecord {
  count: number;
  date: string;
}

const FREE_LIMITS: Record<FeatureType, number> = {
  ai_chat: 10,
  ocr_scan: 3, // Free users get 3 OCR translations
  map_search: 20,
  job_search: 10,
  translation: 10,
};

export const subscriptionManager = {
  async isPremium(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    const status = localStorage.getItem("vaqta_subscription_status");
    if (status === "premium") {
      const expires = localStorage.getItem("vaqta_subscription_expires");
      if (expires && new Date(expires) > new Date()) return true;
    }
    return false;
  },

  async checkAccess(feature: FeatureType): Promise<{ allowed: boolean; remaining: number }> {
    const premium = await this.isPremium();
    if (premium) return { allowed: true, remaining: Infinity };

    const today = new Date().toISOString().split("T")[0];
    const key = `vaqta_usage_${feature}_${today}`;
    let usage: UsageRecord = { count: 0, date: today };

    try {
      const stored = localStorage.getItem(key);
      if (stored) usage = JSON.parse(stored);
    } catch {}

    if (usage.date !== today) {
      usage = { count: 0, date: today };
    }

    const limit = FREE_LIMITS[feature];
    const remaining = Math.max(0, limit - usage.count);
    return { allowed: remaining > 0, remaining };
  },

  async incrementUsage(feature: FeatureType): Promise<void> {
    const premium = await this.isPremium();
    if (premium) return;

    const today = new Date().toISOString().split("T")[0];
    const key = `vaqta_usage_${feature}_${today}`;
    let usage: UsageRecord = { count: 0, date: today };

    try {
      const stored = localStorage.getItem(key);
      if (stored) usage = JSON.parse(stored);
    } catch {}

    if (usage.date !== today) usage = { count: 0, date: today };
    usage.count += 1;

    try {
      localStorage.setItem(key, JSON.stringify(usage));
    } catch {}
  },

  getLimits(): Record<FeatureType, number> {
    return { ...FREE_LIMITS };
  },

  async activatePremium(days: number = 30): Promise<void> {
    if (typeof window === "undefined") return;
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    localStorage.setItem("vaqta_subscription_status", "premium");
    localStorage.setItem("vaqta_subscription_expires", expires.toISOString());
  },

  async deactivatePremium(): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.removeItem("vaqta_subscription_status");
    localStorage.removeItem("vaqta_subscription_expires");
  },
};