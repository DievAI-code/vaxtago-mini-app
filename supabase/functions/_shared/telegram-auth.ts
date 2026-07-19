/// <reference path="../deno-env.d.ts" />
import { createHmac, createHash } from "https://deno.land/std@0.190.0/node/crypto.ts";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

export interface ParsedInitData {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  photoUrl?: string;
  authDate: number;
}

function computeHash(data: string, key: string): string {
  return createHmac("sha256", key).update(data).digest("hex");
}

export function validateInitData(initData: string): ParsedInitData | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;

    const dataCheckArr: string[] = [];
    const keys: string[] = [];
    params.forEach((value, key) => {
      if (key !== "hash") keys.push(key);
    });
    keys.sort();
    for (const key of keys) {
      dataCheckArr.push(`${key}=${params.get(key)}`);
    }
    const dataCheckString = dataCheckArr.join("\n");

    const secretKey = computeHash("WebAppData", BOT_TOKEN);
    const calculatedHash = computeHash(dataCheckString, secretKey);

    if (calculatedHash !== hash) return null;

    const authDate = Number(params.get("auth_date") ?? "0");
    // Optional: check authDate is not too old (e.g., 24h)
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) return null;

    const userJson = params.get("user");
    if (!userJson) return null;
    const user = JSON.parse(userJson);

    return {
      telegramId: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      languageCode: user.language_code,
      photoUrl: user.photo_url,
      authDate,
    };
  } catch {
    return null;
  }
}