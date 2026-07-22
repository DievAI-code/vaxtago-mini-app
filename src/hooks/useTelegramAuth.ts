import { useState, useCallback } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/database";

export function useTelegramAuth() {
  const { webApp, user, initData } = useTelegram();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const ensureProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) return null;
    setLoading(true);
    try {
      const photoUrl = (webApp as any)?.initDataUnsafe?.user?.photo_url ?? null;
      
      const { data, error } = await supabase
        .from("users")
        .upsert({
          telegram_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          avatar_url: photoUrl,
          language_code: user.language_code || "uz",
          last_login: new Date().toISOString(),
        }, { 
          onConflict: 'telegram_id' 
        })
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      localStorage.setItem("vaxtago_user_data", JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn("Telegram auth error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, webApp]);

  return { webApp, user, initData, loading, profile, ensureProfile };
}