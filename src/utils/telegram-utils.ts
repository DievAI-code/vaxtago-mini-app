export const BOT_USERNAME = "VaxtaGO_bot";
export const MINI_APP_URL = "https://vaxtago-bydievds.vercel.app/";

export interface TelegramLoginUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  auth_date: number;
  hash: string;
}

export function isInTelegram(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function openTelegram(): void {
  console.warn("openTelegram called but using Telegram Login Widget / Mini App");
}