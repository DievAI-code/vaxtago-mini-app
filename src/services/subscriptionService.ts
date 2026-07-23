"use client";

import { subscription, FeatureType, AccessResult } from "./subscription";

export const subscriptionService = {
  async getUsage() {
    const settings = await subscription.getSettings();
    const accessAI = await subscription.checkUserAccess("ai");
    const accessOCR = await subscription.checkUserAccess("ocr");
    const accessMap = await subscription.checkUserAccess("maps");

    const status = accessAI.isPremium || settings.premium_mode === "all" ? "premium" : "free";

    return {
      status: status as 'free' | 'premium',
      ai_remaining: accessAI.remaining,
      ocr_remaining: accessOCR.remaining,
      map_remaining: accessMap.remaining,
      mode: settings.premium_mode
    };
  },

  async canUse(feature: 'ai' | 'ocr' | 'map' | 'jobs'): Promise<boolean> {
    const featMap: Record<string, FeatureType> = {
      ai: 'ai',
      ocr: 'ocr',
      map: 'maps',
      jobs: 'jobs'
    };
    const res = await subscription.checkUserAccess(featMap[feature] || 'ai');
    return res.allowed;
  },

  async canUseFeature(feature: 'ai' | 'ocr' | 'map' | 'jobs' | 'vision'): Promise<boolean> {
    const f = feature === 'vision' ? 'ocr' : feature;
    return this.canUse(f as any);
  },

  async trackUsage(feature: 'ai' | 'ocr' | 'map' | 'jobs') {
    const featMap: Record<string, FeatureType> = {
      ai: 'ai',
      ocr: 'ocr',
      map: 'maps',
      jobs: 'jobs'
    };
    await subscription.trackUsage(featMap[feature] || 'ai');
  }
};