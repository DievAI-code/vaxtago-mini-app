/// <reference path="../deno-env.d.ts" />

export type AIProvider = "openrouter" | "openai";

export interface AIRequest {
  messages: Array<{ role: string; content: string }>;
  useVision?: boolean;
  imageBase64?: string;
  instruction?: string;
  lang?: string;
}

export interface AIResult {
  text: string;
  provider: AIProvider;
  model: string;
}

const OPENROUTER_FREE_MODEL = "openrouter/free";
const OPENAI_VISION_MODEL = "gpt-4o";
const OPENAI_TEXT_MODEL = "gpt-4o";

function getOpenRouterKey(): string | undefined {
  return Deno.env.get("OPENROUTER_API_KEY");
}

function getOpenAIKey(): string | undefined {
  return Deno.env.get("OPENAI_API_KEY");
}

async function callOpenRouter(
  messages: Array<{ role: string; content: string }>,
  model: string,
): Promise<string> {
  const key = getOpenRouterKey();
  if (!key) throw new Error("OpenRouter key missing");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
      messages,
      provider: {
        allow_fallbacks: true,
      },
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty OpenRouter response");
  return text.trim();
}

async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  model: string,
  imageBase64?: string,
  instruction?: string,
): Promise<string> {
  const key = getOpenAIKey();
  if (!key) throw new Error("OpenAI key missing");

  const content: any[] = [];
  if (instruction) {
    content.push({ type: "text", text: instruction });
  } else if (messages.length > 0) {
    content.push({ type: "text", text: messages[messages.length - 1].content });
  }
  if (imageBase64) {
    content.push({ type: "image_url", image_url: { url: imageBase64 } });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [
        { role: "system", content: "Ты — AI-помощник VaxtaGo для мигрантов в России." },
        { role: "user", content },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty OpenAI response");
  return text.trim();
}

export async function routeAI(req: AIRequest): Promise<AIResult> {
  const openAIKey = getOpenAIKey();

  if (req.useVision && req.imageBase64) {
    if (openAIKey) {
      try {
        const text = await callOpenAI([], OPENAI_VISION_MODEL, req.imageBase64, req.instruction);
        return { text, provider: "openai", model: OPENAI_VISION_MODEL };
      } catch (e) {
        console.error("OpenAI vision failed, falling back to OpenRouter:", e instanceof Error ? e.message : "unknown");
      }
    }
    const orKey = getOpenRouterKey();
    if (orKey) {
      const text = await callOpenRouter(
        [{ role: "user", content: req.instruction ?? "Проанализируй изображение." }],
        "openai/gpt-4o",
      );
      return { text, provider: "openrouter", model: "openai/gpt-4o" };
    }
    return { text: "⚠️ AI-сервис недоступен.", provider: "openrouter", model: "none" };
  }

  const orKey = getOpenRouterKey();
  if (orKey) {
    try {
      const text = await callOpenRouter(req.messages, OPENROUTER_FREE_MODEL);
      return { text, provider: "openrouter", model: OPENROUTER_FREE_MODEL };
    } catch (e) {
      console.error("OpenRouter text failed:", e instanceof Error ? e.message : "unknown");
    }
  }

  if (openAIKey) {
    const text = await callOpenAI(req.messages, OPENAI_TEXT_MODEL);
    return { text, provider: "openai", model: OPENAI_TEXT_MODEL };
  }

  return { text: "⚠️ AI-сервис недоступен.", provider: "openrouter", model: "none" };
}