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
  | "migration"
  | "premium"
  | "chat"
  | "help";

export interface AIRequest {
  type: AIRequestType;
  text?: string;
  image?: string;
  language?: string;
  userId?: string | number;
  context?: string;
  hasImage?: boolean;
  imageUrl?: string;
  previousMessages?: Array<{ role: string; content: string }>;
}

export interface AIResult {
  text: string;
  model: string;
  provider: string;
  intent?: string;
  action?: string;
  language?: string;
}

export type Intent =
  | "CHAT"
  | "TRANSLATE"
  | "OCR"
  | "OCR_TRANSLATE"
  | "DOCUMENT_ANALYSIS"
  | "JOB_SEARCH"
  | "EMPLOYER_CHECK"
  | "PREMIUM"
  | "HELP"
  | "LEGAL"
  | "MIGRATION";

const SYSTEM_PROMPTS: Record<AIRequestType, string> = {
  assistant:
    "Ты VaxtaGo AI Assistant.\nТы помогаешь пользователям из Узбекистана найти работу в России, разобраться с документами и переводами.\nОтвечай на языке пользователя.\nПоддерживаемые языки: Русский, Узбекский, Таджикский, Кыргызский, Английский.",
  vision:
    "Ты система OCR и анализа документов VaxtaGo.\nРаспознай текст на изображении и верни ТОЛЬКО распознанный текст без комментариев.\nЕсли текста нет — напиши 'Текст не найден'.",
  translation:
    "Ты переводчик. Переведи текст на указанный язык, сохраняя смысл.\nЕсли пользователь просит перевести предыдущий ответ ассистента, используй предыдущий ответ ассистента как источник перевода. Не повторяй запрос пользователя.\nВерни ТОЛЬКО перевод в формате:\nПеревод:\n...",
  document:
    "Ты помощник по документам VaxtaGo.\nОбъясни права и риски простым языком.\nПроверь договоры на скрытые условия.",
  vacancy:
    "Ты помощник по поиску работы VaxtaGo.\nУчитывай риски и реальный доход.\nПредлагай только проверенные вакансии.",
  employer_check:
    "Ты помощник по проверке работодателей VaxtaGo.\nПроверь по ИНН/ОГРН.\nДай оценку риска мошенничества.",
  legal:
    "Ты юридический помощник VaxtaGo.\nОбъясни права мигрантов в РФ.\nСсылайся на законы просто.",
  migration:
    "Ты помощник по миграции VaxtaGo.\nОбъясни МВД, патенты, регистрацию.\nДай чёткий план действий.",
  premium:
    "Ты помощник по Premium подписке VaxtaGo.\nОбъясни преимущества и помоги оформить.",
  chat:
    "Ты дружелюбный собеседник VaxtaGo.\nПоддерживай беседу и помогай с общими вопросами.",
  help:
    "Ты помощник по приложению VaxtaGo.\nОбъясни как пользоваться: поиск работы, перевод, сканер, профиль, премиум.\nОтвечай кратко и по делу.",
};

// Fallback chain — order matters
const MODELS = [
  "openai/gpt-4o-mini",
  "google/gemini-2.5-flash",
  "anthropic/claude-3.5-haiku",
];

function getApiKey(): string | undefined {
  return Deno.env.get("OPENROUTER_API_KEY");
}

export function detectIntent(input: string, hasImage: boolean = false, previousMessages: Array<{ role: string; content: string }> = []): Intent {
  const low = input.toLowerCase();

  if (previousMessages.length > 0) {
    const lastUserMsg = [...previousMessages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      const lastLow = lastUserMsg.content.toLowerCase();
      if ((lastLow.includes("перевед") || lastLow.includes("translate")) && !lastLow.includes("оригинал") && !hasImage) {
        if (low.trim().length > 0 && !low.includes("перевед") && !low.includes("translate")) {
          return "TRANSLATE";
        }
      }
    }
  }

  if (hasImage) {
    if (low.includes("перевед") || low.includes("translate") || low.includes("перевод")) return "OCR_TRANSLATE";
    if (low.includes("документ") || low.includes("паспорт") || low.includes("договор") || low.includes("справка") || low.includes("contract") || low.includes("document") || low.includes("ҳуҷҷат")) return "DOCUMENT_ANALYSIS";
    if (low.includes("адрес") || low.includes("address") || low.includes("где")) return "OCR";
    if (low.includes("ваканс") || low.includes("работ") || low.includes("vacancy") || low.includes("job")) return "OCR";
    return "OCR";
  }

  if (low.includes("премиум") || low.includes("premium") || low.includes("купить") || low.includes("оплат") || low.includes("подписк")) return "PREMIUM";
  if (low.includes("помощ") || low.includes("help") || low.includes("как пользовать") || low.includes("инструкц") || low.includes("что умеешь")) return "HELP";
  if (low.includes("перевед") || low.includes("translate") || low.includes("перевод")) return "TRANSLATE";
  if (low.includes("закон") || low.includes("право") || low.includes("юрист") || low.includes("штраф") || low.includes("суд") || low.includes("law") || low.includes("legal") || low.includes("патент")) return "LEGAL";
  if (low.includes("миграц") || low.includes("мвд") || low.includes("регистрац") || low.includes("виза") || low.includes("migration")) return "MIGRATION";
  if (low.includes("работ") || low.includes("ваканс") || low.includes("job") || low.includes("иш") || low.includes("vacancy")) return "JOB_SEARCH";
  if (low.includes("проверь работодателя") || low.includes("employer") || low.includes("проверка") || low.includes("инн") || low.includes("огрн")) return "EMPLOYER_CHECK";
  if (low.includes("паспорт") || low.includes("договор") || low.includes("документ") || low.includes("разрешение") || low.includes("document") || low.includes("contract") || low.includes("ҳуҷҷат")) return "DOCUMENT_ANALYSIS";
  if (low.includes("привет") || low.includes("hello") || low.includes("hi") || low.includes("salom") || low.includes("салом")) return "CHAT";
  return "CHAT";
}

export function getActionForIntent(intent: Intent): string {
  switch (intent) {
    case "JOB_SEARCH": return "search_jobs";
    case "TRANSLATE": return "open_ocr";
    case "OCR": return "process_image";
    case "OCR_TRANSLATE": return "process_image_translate";
    case "DOCUMENT_ANALYSIS": return "analyze_document";
    case "EMPLOYER_CHECK": return "check_employer";
    case "PREMIUM": return "open_premium";
    case "HELP": return "show_help";
    case "LEGAL": return "show_legal";
    case "MIGRATION": return "show_migration";
    default: return "chat";
  }
}

function mapIntentToRequestType(intent: Intent): AIRequestType {
  switch (intent) {
    case "JOB_SEARCH": return "vacancy";
    case "TRANSLATE": return "translation";
    case "OCR": return "vision";
    case "OCR_TRANSLATE": return "vision";
    case "DOCUMENT_ANALYSIS": return "document";
    case "EMPLOYER_CHECK": return "employer_check";
    case "PREMIUM": return "premium";
    case "HELP": return "help";
    case "LEGAL": return "legal";
    case "MIGRATION": return "migration";
    default: return "chat";
  }
}

async function tryModel(model: string, messages: any[]): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const body = {
    model,
    temperature: 0.7,
    max_tokens: 1500,
    messages,
  };

  console.log("AI MODEL TRY:", model);
  console.log("Messages:", JSON.stringify(messages, null, 2));
  console.log("OpenRouter request:", JSON.stringify(body, null, 2));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  let response: Response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json; charset=utf-8",
        "HTTP-Referer": Deno.env.get("APP_DOMAIN") ?? "https://vaxtago.app",
        "X-Title": "VaxtaGo",
      },
      body: JSON.stringify(body),
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

  console.log("AI MODEL RESPONSE STATUS:", response.status);
  const bodyText = await response.text();
  console.log("OpenRouter response:", bodyText.slice(0, 500));

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
  console.log("Model response:", answer.slice(0, 200));
  return answer.trim();
}

async function withRetry(fn: () => Promise<string>, retries = 2): Promise<string> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("unknown");
      console.log(`AI ROUTER - RETRY ${i + 1}/2: ${lastError.message}`);
      if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastError || new Error("AI request failed after retries");
}

export async function createAIRequest(req: AIRequest): Promise<AIResult> {
  const startTime = Date.now();
  const previous = req.previousMessages ?? [];
  const intent = detectIntent(req.text || "", !!req.image || !!req.hasImage, previous);
  const requestType = mapIntentToRequestType(intent);
  console.log("AI ROUTER START - intent:", intent, "type:", requestType);
  let lastError: Error | null = null;

  for (const model of MODELS) {
    try {
      const messages = buildMessages(req, requestType, previous);
      const text = await withRetry(() => tryModel(model, messages));
      console.log("AI MODEL SUCCESS:", model);
      const duration = Date.now() - startTime;
      logRequest({
        user: req.userId,
        task: requestType,
        model,
        provider: "openrouter",
        duration_ms: duration,
        success: true,
      });
      return {
        text,
        model,
        provider: "openrouter",
        intent,
        action: getActionForIntent(intent),
        language: req.language,
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("unknown");
      console.log("AI MODEL FAILED:", model, "->", lastError.message);
    }
  }

  const duration = Date.now() - startTime;
  logRequest({
    user: req.userId,
    task: requestType,
    duration_ms: duration,
    success: false,
    error: lastError?.message || "all models failed",
  });
  return {
    text: "AI временно занят. Попробуйте ещё раз.",
    model: "none",
    provider: "none",
    intent,
    action: getActionForIntent(intent),
    language: req.language,
  };
}

function buildMessages(req: AIRequest, task: AIRequestType, previous: Array<{ role: string; content: string }>): any[] {
  const system = SYSTEM_PROMPTS[task];

  if (task === "vision") {
    const content: any[] = [{ type: "text", text: (req.text || "Распознай текст на изображении.") }];
    if (req.image) content.push({ type: "image_url", image_url: { url: req.image } });
    if (req.imageUrl) content.push({ type: "image_url", image_url: { url: req.imageUrl } });
    return [{ role: "system", content: system }, { role: "user", content }];
  }

  if (task === "translation") {
    const langName =
      req.language === "uz" ? "узбекский"
      : req.language === "tg" ? "таджикский"
      : req.language === "ky" ? "кыргызский"
      : req.language === "en" ? "английский"
      : "русский";
    
    // Find the most recent assistant message to translate
    let previousAssistantMessage = "";
    for (let i = previous.length - 1; i >= 0; i--) {
      if (previous[i].role === "assistant") {
        previousAssistantMessage = previous[i].content;
        break;
      }
    }
    
    const userMessage = req.text || "";
    
    // If there's a previous assistant message, translate it
    if (previousAssistantMessage) {
      return [
        { role: "system", content: system },
        { role: "user", content: `Переведи на ${langName} язык:\n\n${previousAssistantMessage}` },
      ];
    }
    
    // Otherwise, translate the current user message
    return [
      { role: "system", content: system },
      { role: "user", content: `Переведи на ${langName} язык:\n\n${userMessage}` },
    ];
  }

  // CHAT / ASSISTANT / DOCUMENT etc. — proper conversation turns
  const messages: any[] = [{ role: "system", content: system }];
  for (const m of previous) {
    if (m.role === "user" || m.role === "assistant") {
      messages.push({ role: m.role, content: m.content });
    }
  }
  messages.push({ role: "user", content: req.text || "" });
  return messages;
}