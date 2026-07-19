import { useState, useEffect } from "react";

export const BOT_USERNAME = "VaxtaGO_bot";

export function isInTelegram(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function getPlatform(): "windows" | "macos" | "linux" | "android" | "ios" | "unknown" {
  const ua = navigator.userAgent;
  const platform = navigator.platform?.toLowerCase() || "";

  if (/windows nt/i.test(ua) || platform.includes("win")) return "windows";
  if (/mac os x/i.test(ua) || platform.includes("mac")) return "macos";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/linux/i.test(ua)) return "linux";
  return "unknown";
}

export function openTelegram(): void {
  const platform = getPlatform();
  const tgUrl = `tg://resolve?domain=${BOT_USERNAME}&startapp`;
  const webUrl = `https://t.me/${BOT_USERNAME}?startapp`;

  if (platform === "android" || platform === "ios") {
    // Try tg:// first, then fallback to web
    const started = Date.now();
    window.location.href = tgUrl;
    setTimeout(() => {
      if (Date.now() - started < 2000) {
        window.location.href = webUrl;
      }
    }, 1500);
  } else {
    // Desktop: try tg:// first, then fallback to web after 2s
    const started = Date.now();
    const newWindow = window.open(tgUrl, "_blank");
    if (!newWindow) {
      window.location.href = tgUrl;
    }
    setTimeout(() => {
      if (Date.now() - started < 2000) {
        window.location.href = webUrl;
      }
    }, 2000);
  }
}

export function useTelegramAuth() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isInTelegram()) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        if (!tg) {
          setLoading(false);
          return;
        }

        const user = tg.initDataUnsafe?.user;
        if (!user) {
          setLoading(false);
          return;
        }

        // Send initData to server for validation
        const response = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initData: tg.initData,
            user: {
              id: user.id,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              language_code: user.language_code,
            },
          }),
        });

        if (response.ok) {
          setIsAuthed(true);
        } else {
          setError("Auth failed");
        }
      } catch (err) {
        setError("Auth error");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return { isAuthed, loading, error, isInTelegram: isInTelegram() };
}