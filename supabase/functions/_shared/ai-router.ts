/// <reference path="../deno-env.d.ts" />
import { logRequest } from "./logger.ts";

export type AIRequestType =
  | "assistant"
  | "vision"
  | "document"
  | "vacancy"
  | "employer_check"
  | "legal"
  | "migration"
  | "premium"
  | "chat"
  | "help"
  | "translation";

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
  | "GENERAL_CHAT"
  | "TRANSLATION"
  | "OCR_DOCUMENT"
  | "VISION_ANALYSIS"
  | "VACANCY_SEARCH"
  | "LEGAL_HELP"
  | "DOCUMENT_ANALYSIS"
  | "EMPLOYER_CHECK"
  | "LOCATION_SEARCH"
  | "PREMIUM"
  | "HELP"
  | "MIGRATION";

const SYSTEM_PROMPTS: Record<AIRequestType, string> = {
  assistant:
    "Ты VaxtaGo AI — дружелюбный помощник для трудовых мигрантов в России.\nПравило адресов: Никогда не сообщай и не выдумывай точный адрес, номер дома или координаты самостоятельно, если они не получены через карту или геокодер.\nОтвечай естественно и кратко. Языки: Русский, Узбекский, Таджикский, Кыргызский, Английский.",
  translation:
    "Ты — Translation Engine VaxtaGo.\nВерни ТОЛЬКО переведенный текст. Без объяснений и без приветствий.",
  vision:
    "Ты система OCR и анализа документов VaxtaGo.\nРаспознай текст на изображении и верни ТОЛЬКО распознанный текст.",
  document:
    "Ты помощник по документам VaxtaGo. Объясни права и риски простым языком.",
  vacancy:
    "Ты помощник по поиску работы VaxtaGo. Предлагай только проверенные вакансии.",
  employer_check:
    "Ты помощник по проверке работодателей VaxtaGo. Дай оценку риска мошенничества.",
  legal:
    "Ты юридический помощник VaxtaGo. Объясни права мигрантов в РФ.",
  migration:
    "Ты помощник по миграции VaxtaGo. Объясни МВД, патенты, регистрацию.",
  premium:
    "Ты помощник по Premium подписке VaxtaGo.",
  chat:
    "Ты дружелюбный собеседник VaxtaGo.",
  help:
    "Ты помощник по приложению VaxtaGo. Отвечай кратко и по делу.",
};

const MODELS = [
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "qwen/qwen-2.5-7b-instruct:free",
  "openai/gpt-4o-mini",
];

function getApiKey(): string | undefined {
  return Deno.env.get("OPENROUTER_API_KEY");
}

export function detectIntent(input: string, hasImage: boolean = false, previousMessages: Array<{ role: string; content: string }> = []): Intent {
  const low = input.toLowerCase();

  if (hasImage) {
    if (low.includes("документ") || low.includes("паспорт") || low.includes("договор") || low.includes("справка") || low.includes("contract") || low.includes("document") || low.includes("ҳуҷҷат")) return "DOCUMENT_ANALYSIS";
    return "OCR_DOCUMENT";
  }

  // Location search keywords
  if (
    /найди адрес|покажи адрес|где находится|найти место|покажи на карте|маршрут до|аэропорт|вокзал|жд вокзал|метро|больница|рынок|улица|проспект|корпус/i.test(low)
  ) {
    return "LOCATION_SEARCH";
  }

  // Translation detection
  if (
    /перевед|перевод|таржима|таражума|translate|translation|русский|узбек|ўзбек|o'zbek|tojik|таҷик|кыргыз|kyrgyz|english|на русск|на узб|на англ/i.test(low)
  ) {
    return "TRANSLATION";
  }

  if (low.includes("премиум") || low.includes("premium") || low.includes("купить") || low.includes("оплат") || low.includes("подписк")) return "PREMIUM";
  if (low.includes("помощ") || low.includes("help") || low.includes("как пользовать") || low.includes("инструкц") || low.includes("что умеешь")) return "HELP";
  if (low.includes("закон") || low.includes("право") || low.includes("юрист") || low.includes("штраф") || low.includes("суд") || low.includes("law") || low.includes("legal") || low.includes("патент")) return "LEGAL_HELP";
  if (low.includes("миграц") || low.includes("мвд") || low.includes("регистрац") || low.includes("виза") || low.includes("migration")) return "MIGRATION";
  if (low.includes("работ") || low.includes("ваканс") || low.includes("job") || low.includes("иш") || low.includes("vacancy")) return "VACANCY_SEARCH";
  if (low.includes("проверь работодателя") || low.includes("employer") || low.includes("проверка") || low.includes("инн") || low.includes("огрн")) return "EMPLOYER_CHECK";
  if (low.includes("паспорт") || low.includes("договор") || low.includes("документ") || low.includes("разрешение") || low.includes("document") || low.includes("contract") || low.includes("ҳуҷҷат")) return "DOCUMENT_ANALYSIS";
  
  return "GENERAL_CHAT";
}

export function getActionForIntent(intent: Intent): string {
  switch (intent) {
    case "LOCATION_SEARCH": return "search_location";
    case "VACANCY_SEARCH": return "search_jobs";
    case "OCR_DOCUMENT": return "process_image";
    case "VISION_ANALYSIS": return "vision_analysis";
    case "DOCUMENT_ANALYSIS": return "analyze_document";
    case "TRANSLATION": return "translate";
    case "EMPLOYER_CHECK": return "check_employer";
    case "PREMIUM": return "open_premium";
    case "HELP": return "show_help";
    case "LEGAL_HELP": return "show_legal";
    case "MIGRATION": return "show_migration";
    default: return "chat";
  }
}

function mapIntentToRequestType(intent: Intent): AIRequestType {
  switch (intent) {
    case "LOCATION_SEARCH": return "chat";
    case "VACANCY_SEARCH": return "vacancy";
    case "OCR_DOCUMENT": return "vision";
    case "VISION_ANALYSIS": return "vision";
    case "DOCUMENT_ANALYSIS": return "document";
    case "TRANSLATION": return "translation";
    case "EMPLOYER_CHECK": return "employer_check";
    case "PREMIUM": return "premium";
    case "HELP": return "help";
    case "LEGAL_HELP": return "legal";
    case "MIGRATION": return "migration";
    default: return "chat";
  }
}

function isGuardrailOrPolicyError(bodyText: string): boolean {
  return /No endpoints available|guardrail|privacy|policy|data policy/i.test(bodyText);
}

async function tryModel(model: string, messages: any[]): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const body = { model, temperature: 0.7, max_tokens: 1500, messages };
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
    if (err instanceof Error && err.name === "AbortError") throw new Error("OpenRouter timeout (30s)");
    throw err;
  }
  clearTimeout(timeoutId);

  if (response.status === 401) throw new Error("Auth failed");
  if (response.status === 429) throw new Error("Rate limit");
  if (response.status === 404) throw new Error("Model unavailable (404)");
  if (response.status >= 500) throw new Error(`Server error ${response.status}`);

  const bodyText = await response.text();
  if (isGuardrailOrPolicyError(bodyText)) {
    console.error(`[OpenRouter Guardrail/Policy] model=${model} status=${response.status} body=${bodyText.slice(0, 500)}`);
    throw new Error(`Model ${model} blocked by guardrail/policy: ${bodyText.slice(0, 200)}`);
  }
  let data: any;
  try { data = JSON.parse(bodyText); } catch { throw new Error("Invalid JSON from AI"); }
  if (data?.error) throw new Error(`OpenRouter error: ${data.error.message || "unknown"}`);
  const answer = data?.choices?.[0]?.message?.content || (typeof data?.choices?.[0]?.text === "string" ? data.choices[0].text : null);
  if (!answer) throw new Error("Empty AI response");
  return answer.trim();
}

async function withRetry(fn: () => Promise<string>, retries = 1): Promise<string> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (e) {
      lastError = e instanceof Error ? e : new Error("unknown");
      if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastError || new Error("AI request failed after retries");
}

export async function createAIRequest(req: AIRequest): Promise<AIResult> {
  const startTime = Date.now();
  const previous = (req.previousMessages ?? []).slice(-10);
  const intent = detectIntent(req.text || "", !!req.image || !!req.hasImage, previous);
  const requestType = mapIntentToRequestType(intent);
  let lastError: Error | null = null;

  for (const model of MODELS) {
    try {
      const messages = buildMessages(req, requestType, previous);
      const text = await withRetry(() => tryModel(model, messages));
      logRequest({ user: req.userId, task: requestType, model, provider: "openrouter", duration_ms: Date.now() - startTime, success: true });
      return { text, model, provider: "openrouter", intent, action: getActionForIntent(intent), language: req.language };
    } catch (e) {
      const err = e instanceof Error ? e : new Error("unknown");
      lastError = err;
      console.error(`[AI Router] model=${model} task=${requestType} error=${err.message}`);
    }
  }

  logRequest({ user: req.userId, task: requestType, duration_ms: Date.now() - startTime, success: false, error: lastError?.message || "all models failed" });
  return { text: "AI временно переключается на резервную модель.", model: "none", provider: "none", intent, action: getActionForIntent(intent), language: req.language };
}

function buildMessages(req: AIRequest, task: AIRequestType, previous: Array<{ role: string; content: string }>): any[] {
  const system = SYSTEM_PROMPTS[task];
  if (task === "vision") {
    const content: any[] = [{ type: "text", text: (req.text || "Распознай текст на изображении.") }];
    if (req.image) content.push({ type: "image_url", image_url: { url: req.image } });
    if (req.imageUrl) content.push({ type: "image_url", image_url: { url: req.imageUrl } });
    return [{ role: "system", content: system }, { role: "user", content }];
  }
  const messages: any[] = [{ role: "system", content: system }];
  for (const m of previous) {
    if (m.role === "user" || m.role === "assistant") messages.push({ role: m.role, content: m.content });
  }
  messages.push({ role: "user", content: req.text || "" });
  return messages;
}