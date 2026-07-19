export const BOT_USERNAME = "VaxtaGO_bot";
export const MINI_APP_URL = "https://vaxtago-bydievds.vercel.app/";

export function isInTelegram(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function openTelegram(): void {
  // Use the official Telegram Mini App deep link
  const url = `https://t.me/${BOT_USERNAME}?startapp=auth`;
  window.location.href = url;
}

export function getMiniAppUrl(): string {
  return MINI_APP_URL;
}