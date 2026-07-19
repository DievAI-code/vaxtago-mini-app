import { createContext, useContext, useEffect, ReactNode, useState } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { isInTelegram } from "@/utils/telegram-utils";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/services/Analytics";

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
  requestPhone: () => void;
  setPhoneAndSave: (phone: string) => Promise<void>;
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
  requestPhone: () => {},
  setPhoneAndSave: async () => {},
});

export function useTelegramUser() {
  return useContext(TelegramContext);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const { user } = useTelegram();
  const inTelegram = isInTelegram();
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
        return;
      } catch {}
    }

    if (!inTelegram) {
      setAuthLoading(false);
      return;
    }

    const tg = window.Telegram?.WebApp;
    if (!tg?.initData) {
      setAuthLoading(false);
      return;
    }

    analytics.track("telegram_auth_start");

    supabase.functions.invoke("auth-telegram", {
      body: { initData: tg.initData },
    })
      .then(({ data, error }) => {
        if (data?.success && data.user) {
          const u = data.user;
          setProfile(u);
          localStorage.setItem("vaxtago_token", data.token || "");
          localStorage.setItem("vaxtago_user", JSON.stringify(u));
          if (u.phone_number || u.phone) {
            setPhone(u.phone_number || u.phone);
            setIsAuthed(true);
            analytics.track("telegram_auth_success");
          } else {
            setNeedsPhone(true);
          }
        } else {
          console.warn("Telegram auth failed:", error || data?.error);
        }
      })
      .catch((err) => console.warn("Auth request error:", err))
      .finally(() => setAuthLoading(false));
  }, [inTelegram]);

  const requestPhone = () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.requestContact?.((ok: boolean, contact: any) => {
      if (ok && contact?.phone_number) {
        setPhoneAndSave(contact.phone_number);
      }
    });
  };

  const setPhoneAndSave = async (phoneNumber: string) => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || "";
    const { data, error } = await supabase.functions.invoke("auth-telegram", {
      body: {
        initData,
        phone_number: phoneNumber,
        telegram_id: profile?.telegram_id ?? user?.id,
        first_name: profile?.first_name ?? user?.first_name,
        last_name: profile?.last_name ?? user?.last_name,
        username: profile?.username ?? user?.username,
        language_code: profile?.language_code ?? user?.language_code,
      },
    });
    if (data?.success && data.user) {
      const u = data.user;
      setProfile(u);
      localStorage.setItem("vaxtago_token", data.token || "");
      localStorage.setItem("vaxtago_user", JSON.stringify(u));
      setPhone(phoneNumber);
      setNeedsPhone(false);
      setIsAuthed(true);
      analytics.track("phone_verified");
    } else {
      console.warn("Phone save failed:", error || data?.error);
    }
  };

  return (
    <TelegramContext.Provider
      value={{
        telegramId: profile?.telegram_id ?? user?.id ?? null,
        firstName: profile?.first_name ?? user?.first_name ?? null,
        lastName: profile?.last_name ?? user?.last_name ?? null,
        username: profile?.username ?? user?.username ?? null,
        languageCode: profile?.language_code ?? user?.language_code ?? null,
        photoUrl: profile?.photo_url ?? user?.photo_url ?? null,
        phone,
        isInTelegram: inTelegram,
        isAuthed,
        needsPhone,
        authLoading,
        profile,
        requestPhone,
        setPhoneAndSave,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}