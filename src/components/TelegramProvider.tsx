import { createContext, useContext, useEffect, ReactNode, useState } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useApp } from "@/lib/theme";
import { isInTelegram } from "@/utils/telegram-utils";
import { supabase } from "@/integrations/supabase/client";

interface TelegramContextType {
  telegramId: number | null;
  firstName: string | null;
  username: string | null;
  languageCode: string | null;
  photoUrl: string | null;
  isInTelegram: boolean;
  isAuthed: boolean;
  authLoading: boolean;
  profile: any | null;
}

const TelegramContext = createContext<TelegramContextType>({
  telegramId: null,
  firstName: null,
  username: null,
  languageCode: null,
  photoUrl: null,
  isInTelegram: false,
  isAuthed: false,
  authLoading: true,
  profile: null,
});

export function useTelegramUser() {
  return useContext(TelegramContext);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const { user } = useTelegram();
  const { lang } = useApp();
  const inTelegram = isInTelegram();
  const [isAuthed, setIsAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    if (!inTelegram) {
      setAuthLoading(false);
      return;
    }

    const tg = window.Telegram?.WebApp;
    if (!tg?.initData) {
      setAuthLoading(false);
      return;
    }

    // Secure server-side validation via Supabase Edge Function
    supabase.functions.invoke("auth-telegram", {
      body: { initData: tg.initData },
    })
      .then(({ data, error }) => {
        if (data?.success && data.user) {
          setProfile(data.user);
          setIsAuthed(true);
        } else {
          console.warn("Telegram auth failed:", error || data?.error);
        }
      })
      .catch((err) => console.warn("Auth request error:", err))
      .finally(() => setAuthLoading(false));
  }, [inTelegram, lang]);

  return (
    <TelegramContext.Provider
      value={{
        telegramId: profile?.telegram_id ?? user?.id ?? null,
        firstName: profile?.first_name ?? user?.first_name ?? null,
        username: profile?.username ?? user?.username ?? null,
        languageCode: profile?.language_code ?? user?.language_code ?? null,
        photoUrl: profile?.photo_url ?? user?.photo_url ?? null,
        isInTelegram: inTelegram,
        isAuthed,
        authLoading,
        profile,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}