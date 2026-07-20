import { createContext, useContext, useEffect, ReactNode, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/services/Analytics";
import type { TelegramLoginUser } from "@/utils/telegram-utils";

interface TelegramContextType {
  telegramId: number | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  languageCode: string | null;
  photoUrl: string | null;
  phone: string | null;
  isAuthed: boolean;
  needsPhone: boolean;
  authLoading: boolean;
  profile: any | null;
  loginWithTelegram: (user: TelegramLoginUser) => Promise<void>;
  requestPhone: () => void;
  setPhoneAndSave: (phone: string) => Promise<void>;
  logout: () => void;
}

const TelegramContext = createContext<TelegramContextType>({
  telegramId: null,
  firstName: null,
  lastName: null,
  username: null,
  languageCode: null,
  photoUrl: null,
  phone: null,
  isAuthed: false,
  needsPhone: false,
  authLoading: true,
  profile: null,
  loginWithTelegram: async () => {},
  requestPhone: () => {},
  setPhoneAndSave: async () => {},
  logout: () => {},
});

export function useTelegramUser() {
  return useContext(TelegramContext);
}

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

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    const cachedToken = localStorage.getItem("vaxtago_token");
    const cachedUser = localStorage.getItem("vaxtago_user");
    if (cachedToken && cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        setProfile(u);
        setIsAuthed(true);
        setPhone(u.phone_number || u.phone || null);
        setAuthLoading(false);
        analytics.track("login_success");
        return;
      } catch {}
    }
    setAuthLoading(false);
  }, []);

  const loginWithTelegram = async (user: TelegramLoginUser) => {
    try {
      analytics.track("login_start");
      
      const { device, browser } = getDeviceInfo();
      
      const { data, error } = await supabase.functions.invoke("auth-telegram", {
        body: {
          telegram_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          photo_url: user.photo_url,
          auth_date: user.auth_date,
          hash: user.hash,
          device,
          browser,
        },
      });

      if (data?.success && data.user) {
        const u = data.user;
        setProfile(u);
        localStorage.setItem("vaxtago_token", data.token || "");
        localStorage.setItem("vaxtago_user", JSON.stringify(u));
        setPhone(u.phone_number || u.phone || null);
        setIsAuthed(true);
        analytics.track("login_success");
        
        if (!u.phone_number && !u.phone) {
          setNeedsPhone(true);
        }
      } else {
        console.warn("Telegram auth failed:", error || data?.error);
      }
    } catch (err) {
      console.warn("Auth request error:", err);
    }
  };

  const requestPhone = () => {
    // For web login, we can't use Telegram's requestContact
    // Instead show a phone input form
    setNeedsPhone(true);
  };

  const setPhoneAndSave = async (phoneNumber: string) => {
    const { data, error } = await supabase.functions.invoke("auth-telegram", {
      body: {
        telegram_id: profile?.telegram_id,
        phone_number: phoneNumber,
        update_phone: true,
      },
    });
    if (data?.success && data.user) {
      const u = data.user;
      setProfile(u);
      localStorage.setItem("vaxtago_user", JSON.stringify(u));
      setPhone(phoneNumber);
      setNeedsPhone(false);
      setIsAuthed(true);
    } else {
      console.warn("Phone save failed:", error || data?.error);
    }
  };

  const logout = () => {
    localStorage.removeItem("vaxtago_token");
    localStorage.removeItem("vaxtago_user");
    setIsAuthed(false);
    setProfile(null);
    setPhone(null);
    setNeedsPhone(false);
    analytics.track("logout");
  };

  return (
    <TelegramContext.Provider
      value={{
        telegramId: profile?.telegram_id ?? null,
        firstName: profile?.first_name ?? null,
        lastName: profile?.last_name ?? null,
        username: profile?.username ?? null,
        languageCode: profile?.language_code ?? null,
        photoUrl: profile?.photo_url ?? null,
        phone,
        isAuthed,
        needsPhone,
        authLoading,
        profile,
        loginWithTelegram,
        requestPhone,
        setPhoneAndSave,
        logout,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}