import { supabase } from "@/integrations/supabase/client";
import { useTelegramUser } from "@/components/TelegramProvider";

export type AppEventName =
  | "website_open"
  | "telegram_open"
  | "login_start"
  | "login_success"
  | "home_open"
  | "vacancy_view"
  | "vacancy_apply"
  | "photo_translate"
  | "document_translate"
  | "ai_request"
  | "logout";

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
    const { telegramId, profile, isInTelegram } = useTelegramUser();
    return {
      telegram_id: telegramId,
      user_id: profile?.id || null,
      source: isInTelegram ? "telegram" : "website",
    };
  }

  async track(eventName: AppEventName, extra?: Record<string, any>) {
    try {
      const { telegram_id, user_id, source } = this.getContext();
      const { device, browser } = getDeviceInfo();
      const page = typeof window !== "undefined" ? window.location.pathname : null;

      await supabase.from("analytics_events").insert({
        event_name: eventName,
        user_id: user_id || null,
        telegram_id: telegram_id || null,
        page,
        device,
        browser,
        country: null,
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
        .select("event_name, created_at, telegram_id, user_id, page");

      if (error) throw error;

      const events = data || [];
      const today = new Date().toISOString().slice(0, 10);

      const uniqueUsers = new Set(
        events.map((e) => e.telegram_id || e.user_id).filter(Boolean)
      ).size;

      const newToday = new Set(
        events
          .filter((e) => e.created_at?.slice(0, 10) === today && e.event_name === "login_success")
          .map((e) => e.telegram_id || e.user_id)
          .filter(Boolean)
      ).size;

      const activeToday = new Set(
        events
          .filter((e) => e.created_at?.slice(0, 10) === today)
          .map((e) => e.telegram_id || e.user_id)
          .filter(Boolean)
      ).size;

      const websiteLogins = events.filter(
        (e) => e.event_name === "login_success" && e.page !== "/telegram"
      ).length;

      const telegramLogins = events.filter(
        (e) => e.event_name === "login_success" && e.page === "/telegram"
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
        telegramLogins,
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