"use client";

import { createContext, useContext, useEffect, ReactNode, useState, useCallback } from "react";
import { UserProfile } from "@/types/database";

interface TelegramContextType {
  user: UserProfile | null;
  isInTelegram: boolean;
  isLoading: boolean;
  logout: () => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export function useTelegramUser() {
  const context = useContext(TelegramContext);
  if (!context) throw new Error("useTelegramUser must be used within TelegramProvider");
  return context;
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInTelegram = Boolean(window.Telegram?.WebApp?.initData);

  useEffect(() => {
    const cachedUser = localStorage.getItem("vaxtago_user");
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        console.error("Failed to parse cached user", e);
      }
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("vaxtago_user");
    localStorage.removeItem("vaxtago_token");
    setUser(null);
  }, []);

  return (
    <TelegramContext.Provider value={{ user, isInTelegram, isLoading, logout }}>
      {children}
    </TelegramContext.Provider>
  );
}