/// <reference path="../deno-env.d.ts" />
import type { Lang } from "./types.ts";
import { DEFAULT_MODELS, APP_DOMAIN, VAXTAGO_SYSTEM_PROMPT } from "./config.ts";

export function getModels(): string[] {
  return [
    "google/gemini-2.5-flash",
    "google/gemini-2.0-flash",
    "openai/gpt-4o-mini",
  ];
}

export function getVisionModel(): string {
  return "openai/gpt-4o";
}

export function extractTextFromResponse(data: any): string {
  if (data?.error) {
    const errorMsg = data.error.message || data.error.code || "Unknown error";
    console.error("❌ OpenRouter error object:", JSON.stringify(data.error));
    throw new Error(`OpenRouter error: ${errorMsg}`);
  }
  if (!data?.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new Error("Empty AI response: no choices");
  }
  const choice = data.choices[0];
  let extractedText: string | null = null;
  if (choice?.message?.content) {
    extractedText = choice.message.content;
  } else if (typeof choice?.text === "string") {
    extractedText = choice.text;
  }

  if (!extractedText) {
    throw new Error("Empty AI response: no content field");
  }

  return extractedText.trim().replace(/\n{3,}/g, "\n\n");
}

export function fallbackReply(message: string, language = "ru"): string {
  const low = message.toLowerCase();
  if (low === "/start") {
    return "👋 Добро пожаловать в VaxtaGo.\n\nЯ помогу с работой, документами, переводом, проверкой работодателя и безопасностью.";
  }
  if (low === "/help") {
    return "Команды:\n/start\n/jobs\n/translate\n/documents\n/verify";
  }
  const replies: Record<string, string> = {
    ru: "Я могу помочь найти работу, проверить работодателя, перевести документы и объяснить ваши права.",
    uz: "Men ish topish, hujjatlarini tarjima qilish va ish beruvchini tekshirishda yordam beraman.",
    en: "I can help with jobs, documents, translation and employer verification.",
  };
  return replies[language] ?? replies.ru;
}

async function isGuardrailError(status: number, bodyText: string): Promise<boolean> {
  if (status === 404) return true;
  if (/guardrail|No endpoints available/i.test(bodyText)) return true;
  return false;
}

export async function callOpenRouter(
  message: string,
  lang: string,
  apiKey: string,
  model: string,
  history: Array<{ role: string; content: string }>,
): Promise<string> {
  console.log(`OPENROUTER MODEL TRY: ${model}`);
  console.log(`AI MODEL TRY: ${model}`);
  const systemPrompt = VAXTAGO_SYSTEM_PROMPT;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message },
  ];

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": APP_DOMAIN,
        "X-Title": "VaxtaGo",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages,
        provider: {
          allow_fallbacks: true,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("❌ OpenRouter request timeout");
      throw new Error("OpenRouter недоступен: превышено время ожидания");
    }
    console.error("❌ OpenRouter network error:", error instanceof Error ? error.message : "unknown");
    throw new Error("OpenRouter недоступен в данный момент");
  }

  console.log(`OpenRouter status: ${response.status}`);

  if (response.status === 401) {
    throw new Error("Ошибка авторизации OpenRouter (проверьте API ключ)");
  }
  if (response.status === 429) {
    throw new Error("Превышен лимит запросов OpenRouter. Попробуйте позже.");
  }
  if (response.status >= 500) {
    throw new Error("Сервис AI временно недоступен. Попробуйте позже.");
  }

  const bodyText = await response.text();
  if (await isGuardrailError(response.status, bodyText)) {
    console.error(`OPENROUTER FALLBACK: model ${model} blocked by guardrail/404`);
    console.log("AI PROVIDER FALLBACK");
    throw new Error(`Model ${model} unavailable: ${bodyText}`);
  }

  let data: any;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error("Некорректный ответ от AI сервиса");
  }

  const text = extractTextFromResponse(data);
  console.log(`OPENROUTER MODEL SUCCESS: ${model}`);
  return text;
}

export async function getAIResponse(
  text: string,
  language: string,
  apiKey: string | undefined,
  models: string[],
  history: Array<{ role: string; content: string }>,
): Promise<string> {
  if (!apiKey || models.length === 0) return fallbackReply(text, language);

  const friendlyUnavailable: Record<string, string> = {
    ru: "⚠️ AI временно недоступен. Попробуйте позже.",
    uz: "⚠️ AI vaqtincha mavjud emas. Keyinroq urinib ko'ring.",
  };

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      return await callOpenRouter(text, language, apiKey, model, history);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("unknown");
      console.error(`OPENROUTER FALLBACK: ${model} -> ${lastError.message}`);
      console.log("AI PROVIDER FALLBACK");
    }
  }

  console.error("❌ All OpenRouter models failed:", lastError?.message);
  return friendlyUnavailable[language] ?? friendlyUnavailable.ru;
}