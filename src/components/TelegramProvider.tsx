import { createContext, useContext, useEffect, ReactNode } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/theme";

interface TelegramContextType {
  telegramId: number | null;
  firstName: string | null;
  username: string | null;
  languageCode: string | null;
  isInTelegram: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
  telegramId: null,
  firstName: null,
  username: null,
  languageCode: null,
  isInTelegram: false,
});

export function useTelegramUser() {
  return useContext(TelegramContext);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const { user, initData } = useTelegram();
  const { lang } = useApp();
  const isInTelegram = !!user;

  useEffect(() => {
    if (!user) return;
    const syncUser = async () => {
      try {
        await supabase.from("telegram_users").upsert(
          {
            telegram_id: user.id,
            username: user.username ?? null,
            first_name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
            language: user.language_code?.slice(0, 2) || lang,
            language_code: user.language_code ?? null,
            last_activity: new Date().toISOString(),
          },
          { onConflict: "telegram_id" }
        );
      } catch (err) {
        console.error("Failed to sync Telegram user:", err);
      }
    };
    syncUser();
  }, [user, initData, lang]);

  return (
    <TelegramContext.Provider
      value={{
        telegramId: user?.id ?? null,
        firstName: user?.first_name ?? null,
        username: user?.username ?? null,
        languageCode: user?.language_code ?? null,
        isInTelegram,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}