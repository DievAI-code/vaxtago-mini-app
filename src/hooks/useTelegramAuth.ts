import { useState, useCallback } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { supabase } from "@/integrations/supabase/client";

export interface VgProfile {
  id: string;
  telegram_id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  language?: string;
  subscription?: string;
}

export function useTelegramAuth() {
  const { webApp, user, initData } = useTelegram();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<VgProfile | null>(null);

  const ensureProfile = useCallback(async (): Promise<VgProfile | null> => {
    if (!user) return null;
    setLoading(true);
    try {
      const photoUrl = (webApp as any)?.initDataUnsafe?.user?.photo_url ?? null;
      const tgId = user.id;
      const firstName = user.first_name ?? null;
      const lastName = user.last_name ?? null;
      const username = user.username ?? null;
      const langCode = user.language_code ?? "ru";

      // Try to find existing profile
      const { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("telegram_id", tgId)
        .maybeSingle();

      if (existing) {
        // Update last known fields if changed
        const updated = {
          first_name: firstName,
          last_name: lastName,
          username: username,
          avatar_url: photoUrl,
          language: langCode,
        };
        await supabase.from("profiles").update(updated).eq("telegram_id", tgId);
        const merged = { ...existing, ...updated };
        setProfile(merged);
        return merged;
      }

      // Create new profile
      const newProfile = {
        telegram_id: tgId,
        first_name: firstName,
        last_name: lastName,
        username: username,
        avatar_url: photoUrl,
        language: langCode,
        subscription: "free",
      };
      const { data: inserted, error } = await supabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        console.warn("Profile insert failed:", error);
        return null;
      }
      setProfile(inserted);
      return inserted;
    } catch (err) {
      console.warn("Telegram auth error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, webApp]);

  return { webApp, user, initData, loading, profile, ensureProfile };
}