export const BOT_USERNAME = "VaxtaGO_bot";
export const MINI_APP_URL = "https://vaxtago-bydievds.vercel.app/";

export function isInTelegram(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}

// No external redirect — auth only works inside the Telegram Mini App.
export function openTelegram(): void {
  // Intentionally a no-op: the app must be opened from Telegram itself.
  console.warn("openTelegram called but Mini App must be launched from Telegram.");
}