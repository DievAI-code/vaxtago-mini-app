/// <reference path="../deno-env.d.ts" />
import { logRequest } from "./logger.ts";

export type AIRequestType =
  | "assistant"
  | "vision"
  | "translation"
  | "document"
  | "vacancy"
  | "employer_check"
  | "legal"
  | "migration";

export interface AIRequest {
  type: AIRequestType;
  text?: string;
  image?: string; // base64 data URI
  language?: string;
  userId?: string | number;
}

export interface AIResult {
  text: string;
  model: string;
  provider: string;
}

const SYSTEM_PROMPTS: Record<AIRequestType, string> = {
  assistant:
    "Ты AI помощник VaxtaGo.\nПомогай пользователям с работой,\nдокументами и миграцией.\nОтвечай на языке пользователя.",
  vision:
    "Ты система OCR и анализа документов VaxtaGo.\nРаспознай текст на изображении и верни ТОЛЬКО распознанный текст без комментариев.\nЕсли текста нет — напиши 'Текст не найден'.",
  translation:
    "Переведи текст на указанный язык.\nСохраняй смысл и структуру документа.\nВерни ТОЛЬКО перевод.",
  document:
    "Проанализируй документ.\nОбъясни права и риски простым языком.",
  vacancy:
    "Ты помощник по поиску работы VaxtaGo.\nУчитывай риски и реальный доход.\nПредлагай только проверенные вакансии.",
  employer_check:
    "Ты помощник по проверке работодателей VaxtaGo.\nПроверь по ИНН/ОГРН.\nДай оценку риска мошенничества.",
  legal:
    "Ты юридический помощник VaxtaGo.\nОбъясни права мигрантов в РФ.\nСсылайся на законы просто.",
  migration:
    "Ты помощник по миграции VaxtaGo.\nОбъясни МВД, патенты, регистрацию.\nДай чёткий план действий.",
};

const MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.0-flash",
  "openrouter/free",
];

function getApiKey(): string | undefined {
  return Deno.env.get("OPENROUTER_API_KEY");
}

function detectTask(input: string, hasImage: boolean = false): AIRequestType {
  const low = input.toLowerCase();

  if (hasImage) {
    console.log("TASK DETECTED: vision (image provided)");
    return "vision";
  }
  if (low.includes("перевед") || low.includes("translate") || low.includes("перевод")) {
    return "translation";
  }
  if (low.includes("закон") || low.includes("право") || low.includes("юрист") || low.includes("штраф") || low.includes("суд") || low.includes("law") || low.includes("legal")) {
    return "legal";
  }
  if (low.includes("миграц") || low.includes("мвд") || low.includes("регистрац") || low.includes("патент") || low.includes("виза") || low.includes("migration")) {
    return "migration";
  }
  if (low.includes("работ") || low.includes("ваканс") || low.includes("job") || low.includes("иш") || low.includes("vacancy")) {
    return "vacancy";
  }
  if (low.includes("проверь работодателя") || low.includes("employer") || low.includes("проверка") || low.includes("инн") || low.includes("огрн")) {
    return "employer_check";
  }
  if (low.includes("паспорт") || low.includes("договор") || low.includes("документ") || low.includes("разрешение") || low.includes("document") || low.includes("contract") || low.includes("ҳуҷҷат")) {
    return "document";
  }
  return "assistant";
}

async function tryModel(model: string, messages: any[]): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  console.log("AI ROUTER - MODEL TRY:", model);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  let response: Response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("APP_DOMAIN") ?? "https://vaxtago.app",
        "X-Title": "VaxtaGo",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 1500,
        messages,
        provider: { allow_fallbacks: true },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("OpenRouter timeout (30s)");
    }
    throw err;
  }
  clearTimeout(timeoutId);

  console.log("AI ROUTER - MODEL RESPONSE STATUS:", response.status);
  const bodyText = await response.text();

  if (response.status === 401) throw new Error("Auth failed");
  if (response.status === 429) throw new Error("Rate limit");
  if (response.status === 404) throw new Error("Model unavailable (404)");
  if (response.status >= 500) throw new Error(`Server error ${response.status}`);
  if (/guardrail|No endpoints available|No allowed providers|privacy/i.test(bodyText)) {
    throw new Error(`Model ${model} blocked: ${bodyText.slice(0, 200)}`);
  }

  let data: any;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error("Invalid JSON from AI");
  }
  if (data?.error) {
    throw new Error(`OpenRouter error: ${data.error.message || "unknown"}`);
  }
  const answer =
    data?.choices?.[0]?.message?.content ||
    (typeof data?.choices?.[0]?.text === "string" ? data.choices[0].text : null);
  if (!answer) throw new Error("Empty AI response");
  return answer.trim();
}

async function withRetry(fn: () => Promise<string>, retries = 2): Promise<string> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("unknown");
      console.log(`AI ROUTER - RETRY ${i + 1}/${retries}: ${lastError.message}`);
      if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastError || new Error("AI request failed after retries");
}

export async function createAIRequest(req: AIRequest): Promise<AIResult> {
  const startTime = Date.now();
  const models = MODELS;
  const task = detectTask(req.text || "", !!req.image);
  console.log("AI ROUTER START - task:", task);
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const messages = buildMessages(req, task);
      const text = await withRetry(() => tryModel(model, messages));
      const duration = Date.now() - startTime;
      logRequest({
        user: req.userId,
        task,
        model,
        provider: "openrouter",
        duration_ms: duration,
        success: true,
      });
      console.log("AI ROUTER - MODEL SUCCESS:", model);
      return { text, model, provider: "openrouter" };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("unknown");
      console.log("AI ROUTER - MODEL FAILED:", model, "->", lastError.message);
      console.log("AI ROUTER - FALLBACK:", model);
    }
  }

  const duration = Date.now() - startTime;
  logRequest({
    user: req.userId,
    task,
    duration_ms: duration,
    success: false,
    error: lastError?.message || "all models failed",
  });
  throw lastError || new Error("AI request failed");
}

function buildMessages(req: AIRequest, task: AIRequestType): any[] {
  const system = SYSTEM_PROMPTS[task];
  if (task === "vision") {
    const content: any[] = [{ type: "text", text: req.text || "Распознай текст на изображении." }];
    if (req.image) content.push({ type: "image_url", image_url: { url: req.image } });
    return [{ role: "system", content: system }, { role: "user", content }];
  }
  if (task === "translation") {
    const langName =
      req.language === "uz" ? "узбекский"
      : req.language === "tg" ? "таджикский"
      : req.language === "ky" ? "кыргызский"
      : req.language === "en" ? "английский"
      : "русский";
    return [
      { role: "system", content: system },
      { role: "user", content: `Переведи на ${langName} язык. Только перевод:\n\n${req.text || ""}` },
    ];
  }
  return [{ role: "system", content: system }, { role: "user", content: req.text || "" }];
}