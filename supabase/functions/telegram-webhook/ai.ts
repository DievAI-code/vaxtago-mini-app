/// <reference path="../deno-env.d.ts" />
import { createAIRequest } from "../_shared/ai-router.ts";

export function getModels(): string[] {
  return ["google/gemini-2.5-flash", "google/gemini-2.0-flash", "openai/gpt-4o-mini"];
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
      ru: "⚠️ AI временно недоступен. Попробуйте позже.",
      uz: "⚠️ AI vaqtincha mavjud emas.",
    };
    return replies[language] ?? replies.ru;
  }
}