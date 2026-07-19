import { createContext, useContext, useEffect, ReactNode, useState } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useApp } from "@/lib/theme";
import { isInTelegram } from "@/utils/telegram-utils";

interface TelegramContextType {
  telegramId: number | null;
  firstName: string | null;
  username: string | null;
  languageCode: string | null;
  isInTelegram: boolean;
  isAuthed: boolean;
  authLoading: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
  telegramId: null,
  firstName: null,
  username: null,
  languageCode: null,
  isInTelegram: false,
  isAuthed: false,
  authLoading: true,
});

export function useTelegramUser() {
  return useContext(TelegramContext);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const { user, initData } = useTelegram();
  const { lang } = useApp();
  const inTelegram = isInTelegram();
  const [isAuthed, setIsAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!inTelegram) {
      setAuthLoading(false);
      return;
    }

    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!tgUser) {
      setAuthLoading(false);
      return;
    }

    // Auto-auth via Supabase
    import("@/integrations/supabase/client").then(async ({ supabase }) => {
      try {
        const { data: existing } = await supabase
          .from("profiles")
          .select("*")
          .eq("telegram_id", tgUser.id)
          .maybeSingle();

        const photoUrl = (window.Telegram as any)?.WebApp?.initDataUnsafe?.user?.photo_url ?? null;

        if (existing) {
          await supabase.from("profiles").update({
            first_name: tgUser.first_name ?? null,
            last_name: tgUser.last_name ?? null,
            username: tgUser.username ?? null,
            avatar_url: photoUrl,
            language: tgUser.language_code ?? "ru",
          }).eq("telegram_id", tgUser.id);
          setIsAuthed(true);
        } else {
          const { error } = await supabase.from("profiles").insert({
            telegram_id: tgUser.id,
            first_name: tgUser.first_name ?? null,
            last_name: tgUser.last_name ?? null,
            username: tgUser.username ?? null,
            avatar_url: photoUrl,
            language: tgUser.language_code ?? "ru",
            subscription: "free",
          });
          if (!error) setIsAuthed(true);
        }
      } catch (err) {
        console.warn("Telegram auth error:", err);
      } finally {
        setAuthLoading(false);
      }
    });
  }, [inTelegram, lang]);

  return (
    <TelegramContext.Provider
      value={{
        telegramId: user?.id ?? null,
        firstName: user?.first_name ?? null,
        username: user?.username ?? null,
        languageCode: user?.language_code ?? null,
        isInTelegram: inTelegram,
        isAuthed,
        authLoading,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}