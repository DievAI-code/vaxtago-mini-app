export const BOT_USERNAME = "VaxtaGO_bot";
export const MINI_APP_URL = "https://vaxtago-bydievds.vercel.app/";

export function isInTelegram(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function openTelegram(): void {
  // Always use HTTPS Mini App deep link (no tg:// scheme)
  const url = `https://t.me/${BOT_USERNAME}?startapp=auth`;
  window.location.href = url;
}