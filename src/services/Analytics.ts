import { supabase } from "@/integrations/supabase/client";
import { AppEventName } from "@/types/analytics";

class AnalyticsService {
  async track(eventName: AppEventName, extra?: Record<string, string | number | boolean | null>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ua = navigator.userAgent;
      const device = /Mobi|Android|iPhone/i.test(ua) ? "mobile" : "desktop";

      await supabase.from("analytics_events").insert({
        event_name: eventName,
        user_id: user?.id || null,
        page: window.location.pathname,
        device,
        created_at: new Date().toISOString(),
        ...extra,
      });
    } catch (error) {
      console.warn("Analytics track failed:", error);
    }
  }

  async getStats() {
    try {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("event_name, created_at, user_id");

      if (error) throw error;

      const events = data || [];
      const today = new Date().toISOString().slice(0, 10);

      return {
        totalUsers: new Set(events.map((e) => e.user_id).filter(Boolean)).size,
        activeToday: new Set(
          events
            .filter((e) => e.created_at?.slice(0, 10) === today)
            .map((e) => e.user_id)
            .filter(Boolean)
        ).size,
        aiRequests: events.filter((e) => e.event_name === "ai_request").length,
        translations: events.filter((e) => e.event_name === "photo_translate").length,
      };
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      return { totalUsers: 0, activeToday: 0, aiRequests: 0, translations: 0 };
    }
  }
}

export const analytics = new AnalyticsService();