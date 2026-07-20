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
  isInTelegram: boolean;
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
  isInTelegram: false,
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

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const inTelegram = Boolean(window.Telegram?.WebApp?.initData);

  useEffect(() => {
    const cachedToken = localStorage.getItem("vaxtago_token");
    const cachedUser = localStorage.getItem("vaxtago_user");
    if (cachedToken && cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        setProfile(u);
        setIsAuthed(true);
        setPhone(u.phone_number || null);
        setAuthLoading(false);
        analytics.track("login_success");
        return;
      } catch {}
    }

    if (!inTelegram) {
      setAuthLoading(false);
      return;
    }

    // Mini App auto-login via initData
    const tg = window.Telegram?.WebApp;
    if (tg?.initData) {
      analytics.track("login_start");
      supabase.functions.invoke("auth-telegram", { body: { initData: tg.initData } })
        .then(({ data, error }) => {
          if (data?.success && data.user) {
            const u = data.user;
            setProfile(u);
            localStorage.setItem("vaxtago_token", data.token || "");
            localStorage.setItem("vaxtago_user", JSON.stringify(u));
            setPhone(u.phone_number || null);
            setIsAuthed(true);
            analytics.track("login_success");
          } else {
            console.warn("Mini App auth failed:", error || data?.error);
            analytics.track("login_error");
          }
        })
        .catch((err) => {
          console.warn("Auth error:", err);
          analytics.track("login_error");
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, [inTelegram]);

  const loginWithTelegram = async (user: TelegramLoginUser) => {
    try {
      analytics.track("login_start");
      const { data, error } = await supabase.functions.invoke("auth-telegram", {
        body: {
          telegram_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          photo_url: user.photo_url,
          language_code: user.language_code,
          auth_date: user.auth_date,
          hash: user.hash,
        },
      });
      if (data?.success && data.user) {
        const u = data.user;
        setProfile(u);
        localStorage.setItem("vaxtago_token", data.token || "");
        localStorage.setItem("vaxtago_user", JSON.stringify(u));
        setPhone(u.phone_number || null);
        setIsAuthed(true);
        analytics.track("login_success");
        if (!u.phone_number) setNeedsPhone(true);
      } else {
        console.warn("Telegram auth failed:", error || data?.error);
        analytics.track("login_error");
        throw new Error("Auth failed");
      }
    } catch (err) {
      console.warn("Auth request error:", err);
      analytics.track("login_error");
      throw err;
    }
  };

  const requestPhone = () => setNeedsPhone(true);

  const setPhoneAndSave = async (phoneNumber: string) => {
    const { data, error } = await supabase.functions.invoke("auth-telegram", {
      body: { telegram_id: profile?.telegram_id, phone_number: phoneNumber, update_phone: true },
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
        isInTelegram: inTelegram,
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