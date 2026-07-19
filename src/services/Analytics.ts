import { supabase } from "@/integrations/supabase/client";
import { useTelegramUser } from "@/components/TelegramProvider";

export type AppEventName =
  | "app_open"
  | "telegram_auth_start"
  | "telegram_auth_success"
  | "phone_verified"
  | "vacancy_open"
  | "vacancy_apply"
  | "photo_translate_start"
  | "photo_translate_success"
  | "ai_assistant_used";

class AnalyticsService {
  private getContext() {
    const { telegramId, profile } = useTelegramUser();
    return {
      telegram_id: telegramId,
      user_id: profile?.id || null,
    };
  }

  async track(eventName: AppEventName, page?: string) {
    try {
      const { telegram_id, user_id } = this.getContext();
      await supabase.from("app_events").insert({
        event_name: eventName,
        page: page || window.location.pathname,
        telegram_id: telegram_id || null,
        user_id: user_id || null,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Analytics track failed:", error);
    }
  }

  async getStats() {
    try {
      const { data, error } = await supabase
        .from("app_events")
        .select("event_name, created_at, telegram_id, user_id");

      if (error) throw error;

      const events = data || [];
      const today = new Date().toISOString().slice(0, 10);

      const uniqueUsers = new Set(
        events.map((e) => e.telegram_id || e.user_id).filter(Boolean)
      ).size;

      const activeToday = new Set(
        events
          .filter((e) => e.created_at?.slice(0, 10) === today)
          .map((e) => e.telegram_id || e.user_id)
          .filter(Boolean)
      ).size;

      const appOpens = events.filter((e) => e.event_name === "app_open").length;

      const aiRequests = events.filter(
        (e) =>
          e.event_name === "ai_assistant_used" ||
          e.event_name === "photo_translate_success"
      ).length;

      // Popular functions
      const funcCounts: Record<string, number> = {};
      events.forEach((e) => {
        if (["vacancy_open", "vacancy_apply", "photo_translate_start", "ai_assistant_used"].includes(e.event_name)) {
          funcCounts[e.event_name] = (funcCounts[e.event_name] || 0) + 1;
        }
      });

      const popularFunctions = Object.entries(funcCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

      return {
        totalUsers: uniqueUsers,
        activeToday,
        appOpens,
        aiRequests,
        popularFunctions,
      };
    } catch (error) {
      console.warn("Analytics getStats failed:", error);
      return {
        totalUsers: 0,
        activeToday: 0,
        appOpens: 0,
        aiRequests: 0,
        popularFunctions: [],
      };
    }
  }
}

export const analytics = new AnalyticsService();