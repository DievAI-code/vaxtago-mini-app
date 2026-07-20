import { supabase } from "@/integrations/supabase/client";
import { useTelegramUser } from "@/components/TelegramProvider";

export type AppEventName =
  | "website_open"
  | "telegram_open"
  | "login_start"
  | "login_success"
  | "login_error"
  | "home_open"
  | "vacancy_view"
  | "vacancy_apply"
  | "photo_translate"
  | "document_translate"
  | "ai_request";

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = "desktop";
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) device = "mobile";
  else if (/Tablet/i.test(ua)) device = "tablet";

  let browser = "unknown";
  if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua)) browser = "Safari";

  return { device, browser };
}

class AnalyticsService {
  private getContext() {
    const { telegramId, profile, isInTelegram } = useTelegramUser();
    return {
      telegram_id: telegramId,
      user_id: profile?.id || null,
      source: isInTelegram ? "telegram" : "website",
    };
  }

  async track(eventName: AppEventName, extra?: Record<string, any>) {
    try {
      const { user_id, telegram_id } = this.getContext();
      const { device, browser } = getDeviceInfo();
      await supabase.from("analytics_events").insert({
        event_name: eventName,
        user_id: user_id || null,
        telegram_id: telegram_id || null,
        page: extra?.page || window.location.pathname,
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
        .select("event_name, created_at, user_id");

      if (error) throw error;

      const events = data || [];
      const today = new Date().toISOString().slice(0, 10);

      const uniqueUsers = new Set(
        events.map((e) => e.user_id).filter(Boolean)
      ).size;

      const newToday = new Set(
        events
          .filter((e) => e.created_at?.slice(0, 10) === today && e.event_name === "login_success")
          .map((e) => e.user_id)
          .filter(Boolean)
      ).size;

      const activeToday = new Set(
        events
          .filter((e) => e.created_at?.slice(0, 10) === today)
          .map((e) => e.user_id)
          .filter(Boolean)
      ).size;

      const websiteLogins = events.filter(
        (e) => e.event_name === "login_success"
      ).length;

      const translations = events.filter(
        (e) => e.event_name === "photo_translate" || e.event_name === "document_translate"
      ).length;

      const aiRequests = events.filter((e) => e.event_name === "ai_request").length;

      const vacancyViews = events.filter((e) => e.event_name === "vacancy_view").length;
      const vacancyApplies = events.filter((e) => e.event_name === "vacancy_apply").length;

      return {
        totalUsers: uniqueUsers,
        newToday,
        activeToday,
        websiteLogins,
        telegramLogins: 0,
        translations,
        aiRequests,
        vacancyViews,
        vacancyApplies,
      };
    } catch (error) {
      console.warn("Analytics getStats failed:", error);
      return {
        totalUsers: 0,
        newToday: 0,
        activeToday: 0,
        websiteLogins: 0,
        telegramLogins: 0,
        translations: 0,
        aiRequests: 0,
        vacancyViews: 0,
        vacancyApplies: 0,
      };
    }
  }
}

export const analytics = new AnalyticsService();