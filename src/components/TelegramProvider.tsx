import { createContext, useContext, useEffect, ReactNode } from "react";
import { useTelegram } from "@/hooks/useTelegram";
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
    // App already opened — run sync in background, never block UI
    if (!user) return;
    const timer = setTimeout(() => {
      import("@/integrations/supabase/client")
        .then(async ({ supabase }) => {
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
            // Never break the Mini App on Supabase error
            console.warn("Telegram user sync failed (non-blocking):", err);
          }
        })
        .catch((err) => console.warn("Supabase import failed (non-blocking):", err));
    }, 1500);
    return () => clearTimeout(timer);
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