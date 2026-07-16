/// <reference path="../deno-env.d.ts" />

export type AIRequestType =
  | "assistant"
  | "vision"
  | "translation"
  | "document"
  | "vacancy"
  | "employer_check";

export interface AIRequest {
  type: AIRequestType;
  text?: string;
  image?: string; // base64 data URI
  language?: string;
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
    "Ты система OCR.\nРаспознай весь текст изображения.\nВерни только распознанный текст.",
  translation:
    "Переведи текст на указанный язык.\nСохраняй смысл документа.",
  document:
    "Проанализируй документ.\nОбъясни простым языком.",
  vacancy:
    "Ты помощник по поиску работы VaxtaGo.\nПомоги найти подходящие вакансии.\nУчитывай риски и реальный доход.",
  employer_check:
    "Ты помощник по проверке работодателей VaxtaGo.\nПроверь работодателя по ИНН/ОГРН.\nДай оценку риска мошенничества.",
};

function getApiKey(): string | undefined {
  return Deno.env.get("OPENROUTER_API_KEY");
}

function getDefaultModel(): string {
  return Deno.env.get("AI_DEFAULT_MODEL") || "google/gemini-2.5-flash";
}

function getFallbackModels(): string[] {
  const env = Deno.env.get("AI_FALLBACK_MODELS");
  if (env) {
    return env.split(",").map((m) => m.trim()).filter(Boolean);
  }
  return ["google/gemini-2.0-flash", "openai/gpt-4o-mini"];
}

function getModelsList(): string[] {
  const def = getDefaultModel();
  const fallbacks = getFallbackModels();
  // Deduplicate, keep default first
  const all = [def, ...fallbacks];
  return Array.from(new Set(all));
}

function detectTask(input: string, hasImage: boolean = false): AIRequestType {
  const low = input.toLowerCase();
  
  if (hasImage) {
    console.log("TASK DETECTED: vision (image provided)");
    return "vision";
  }
  
  if (low.includes("перевед") || low.includes("translate") || low.includes("перевод")) {
    console.log("TASK DETECTED: translation");
    return "translation";
  }
  
  if (low.includes("работ") || low.includes("ваканс") || low.includes("job") || low.includes("иш")) {
    console.log("TASK DETECTED: vacancy");
    return "vacancy";
  }
  
  if (low.includes("проверь работодателя") || low.includes("employer") || low.includes("проверка")) {
    console.log("TASK DETECTED: employer_check");
    return "employer_check";
  }
  
  if (low.includes("паспорт") || low.includes("договор") || low.includes("документ") || 
      low.includes("разрешение") || low.includes("document") || low.includes("contract")) {
    console.log("TASK DETECTED: document");
    return "document";
  }
  
  console.log("TASK DETECTED: assistant (default)");
  return "assistant";
}

async function tryModel(model: string, messages: any[]): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  console.log("MODEL:", model);

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
        provider: {
          allow_fallbacks: true,
        },
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

  console.log("AI RESPONSE STATUS:", response.status);

  const bodyText = await response.text();
  console.log("AI RESPONSE RECEIVED:", bodyText.substring(0, 1000));

  if (response.status === 401) throw new Error("Auth failed");
  if (response.status === 429) throw new Error("Rate limit");
  if (response.status === 404) throw new Error("Model unavailable (404)");
  if (response.status >= 500) throw new Error(`Server error ${response.status}`);

  if (/guardrail|No endpoints available/i.test(bodyText)) {
    throw new Error(`Model ${model} unavailable: ${bodyText}`);
  }

  let data: any;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error("Invalid JSON from AI");
  }

  if (data?.error) {
    console.log("OPENROUTER ERROR:", JSON.stringify(data));
    throw new Error(`OpenRouter error: ${data.error.message || "unknown"}`);
  }

  const answer =
    data?.choices?.[0]?.message?.content ||
    (typeof data?.choices?.[0]?.text === "string" ? data.choices[0].text : null);

  if (!answer) {
    throw new Error("Empty AI response");
  }

  console.log("AI ANSWER LENGTH:", answer.length);
  return answer.trim();
}

export async function createAIRequest(req: AIRequest): Promise<AIResult> {
  console.log("AI ROUTER START");
  console.log("INPUT TYPE:", req.type);

  const models = getModelsList();
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const messages = buildMessages(req);
      const text = await tryModel(model, messages);
      console.log("HANDLER SUCCESS");
      return { text, model, provider: "openrouter" };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("unknown");
      console.log("FALLBACK:", model, "->", lastError.message);
    }
  }

  console.error("AI ROUTER FAILED ALL MODELS");
  throw lastError || new Error("AI request failed");
}

function buildMessages(req: AIRequest): any[] {
  const system = SYSTEM_PROMPTS[req.type];

  if (req.type === "vision") {
    const content: any[] = [{ type: "text", text: req.text || "Распознай текст на изображении." }];
    if (req.image) {
      content.push({ type: "image_url", image_url: { url: req.image } });
    }
    return [
      { role: "system", content: system },
      { role: "user", content },
    ];
  }

  if (req.type === "translation") {
    const langName =
      req.language === "uz" ? "узбекский"
      : req.language === "tg" ? "таджикский"
      : req.language === "ky" ? "кыргызский"
      : req.language === "en" ? "английский"
      : "русский";
    const userText = `Переведи следующий текст на ${langName} язык. Сохрани смысл и структуру. Только перевод, без пояснений:\n\n${req.text || ""}`;
    return [
      { role: "system", content: system },
      { role: "user", content: userText },
    ];
  }

  if (req.type === "vacancy") {
    const userText = `Найди вакансии по запросу: ${req.text || ""}\n\nУчитывай риски и реальный доход.`;
    return [
      { role: "system", content: system },
      { role: "user", content: userText },
    ];
  }

  if (req.type === "employer_check") {
    const userText = `Проверь работодателя по ИНН/ОГРН: ${req.text || ""}\nДай оценку риска мошенничества.`;
    return [
      { role: "system", content: system },
      { role: "user", content: userText },
    ];
  }

  // assistant & document
  return [
    { role: "system", content: system },
    { role: "user", content: req.text || "" },
  ];
}