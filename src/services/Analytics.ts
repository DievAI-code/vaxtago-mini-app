import { supabase } from "@/integrations/supabase/client";
import { useTelegramUser } from "@/components/TelegramProvider";

export type AppEventName =
  | "app_open"
  | "login_start"
  | "login_success"
  | "home_open"
  | "logout"
  | "telegram_auth_start"
  | "telegram_auth_success"
  | "telegram_login_success"
  | "phone_verified"
  | "vacancy_open"
  | "vacancy_apply"
  | "photo_translate_start"
  | "photo_translate_success"
  | "ai_assistant_used";

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = "desktop";
  if (/Android/i.test(ua)) device = "android";
  else if (/iPhone|iPad|iPod/i.test(ua)) device = "ios";
  else if (/Windows Phone/i.test(ua)) device = "windows_phone";

  let browser = "unknown";
  if (/Chrome/i.test(ua)) browser = "chrome";
  else if (/Firefox/i.test(ua)) browser = "firefox";
  else if (/Safari/i.test(ua)) browser = "safari";
  else if (/Edge/i.test(ua)) browser = "edge";

  return { device, browser };
}

class AnalyticsService {
  private getContext() {
    const { telegramId, profile } = useTelegramUser();
    return {
      telegram_id: telegramId,
      user_id: profile?.id || null,
    };
  }

  async track(eventName: AppEventName, extra?: Record<string, any>) {
    try {
      const { telegram_id, user_id } = this.getContext();
      const { device, browser } = getDeviceInfo();
      
      await supabase.from("analytics_events").insert({
        event_name: eventName,
        user_id: user_id || null,
        telegram_id: telegram_id || null,
        device,
        browser,
        created_at: new Date().toISOString(),
        ...extra,
      }).catch(() => {});
    } catch (error) {
      console.warn("Analytics track failed:", error);
    }
  }

  async getStats() {
    try {
      const { data, error } = await supabase
        .from("analytics_events")
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