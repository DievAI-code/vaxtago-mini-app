export const BOT_USERNAME = "VaxtaGO_bot";
export const MINI_APP_URL = "https://vaxtago-bydievds.vercel.app/";

// Telegram Login Widget callback
export interface TelegramLoginUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// No external redirect — auth only works via Telegram Login Widget
export function isInTelegram(): boolean {
  return false; // We now use web login, not Mini App
}

export function openTelegram(): void {
  console.warn("openTelegram called but using Telegram Login Widget");
}