/// <reference path="../deno-env.d.ts" />
import { createAIRequest } from "../_shared/ai-router.ts";

export function getModels(): string[] {
  return ["google/gemini-2.5-flash", "google/gemini-2.0-flash", "openrouter/free"];
}

export async function getAIResponse(
  text: string,
  language: string,
  userId: string | number,
): Promise<string> {
  try {
    const result = await createAIRequest({ type: "assistant", text, language, userId });
    return result.text;
  } catch {
    const replies: Record<string, string> = {
      ru: "⚠️ AI временно переключается на резервный сервер. Попробуйте позже.",
      uz: "⚠️ AI vaqtincha zaxira serverga o'tmoqda. Keyinroq urinib ko'ring.",
      tg: "⚠️ AI вақтан захира серверига гузаштаст. Баъдтар кўшиб кўринг.",
      ky: "⚠️ AI убактык запas серверге которулууда. Кийинчерек аракет кылыңыз.",
      en: "⚠️ AI is temporarily switching to a backup server. Please try later.",
    };
    return replies[language] ?? replies.ru;
  }
}
