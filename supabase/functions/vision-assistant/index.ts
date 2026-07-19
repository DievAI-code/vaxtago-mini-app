/// <reference path="../deno-env.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logRequest } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-init-data",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const MODEL = "google/gemini-2.5-flash";
const FREE_MONTHLY_LIMIT = 10;

const SYSTEM_PROMPT = `Ты Vision AI помощник VaxtaGo.
Помогай людям разбираться с документами, адресами и переводами.
Отвечай простым языком.

Ты получаешь изображение и текстовый запрос пользователя.
Верни ответ в JSON формате со следующими полями:
{
  "ocr_text": "распознанный текст на изображении (или пусто если нет)",
  "translation": "перевод на запрошенный язык (если запрошен)",
  "explanation": "объяснение простым языком: что это за документ, основные данные, даты, сроки действия, важная информация",
  "address": "найденный адрес в формате 'улица, дом, город, регион' (или пусто если не найден)",
  "document_type": "тип документа (патент, договор, паспорт, уведомление, адрес, прочее)"
}`;

interface VisionBody {
  image: string; // base64 data URL
  message?: string;
  language?: string;
  telegram_id?: number;
  user_id?: string;
  request_type?: string;
}

function detectLanguage(text: string, telegramLanguageCode?: string): string {
  if (telegramLanguageCode) {
    const code = telegramLanguageCode.toLowerCase();
    if (code.startsWith("ru")) return "ru";
    if (code.startsWith("uz")) return "uz";
    if (code.startsWith("tg")) return "tg";
    if (code.startsWith("ky")) return "ky";
    if (code.startsWith("en")) return "en";
  }
  const low = text.toLowerCase();
  if (["salom", "ish", "yordam", "shartnoma"].some((w) => low.includes(w))) return "uz";
  if (["салом", "кор", "ярдам", "шартнома"].some((w) => low.includes(w))) return "tg";
  if (["салам", "иш", "жардам", "келишим"].some((w) => low.includes(w))) return "ky";
  if (["hello", "hi", "job", "contract", "help"].some((w) => low.includes(w))) return "en";
  if (/[а-яё]/u.test(text)) return "ru";
  return "ru";
}

async function checkSubscription(supabase: any, telegramId: number | undefined, userId: string | undefined): Promise<{ plan: string; count: number }> {
  try {
    if (telegramId) {
      const { data } = await supabase
        .from("profiles")
        .select("subscription, vision_requests_count")
        .eq("telegram_id", telegramId)
        .maybeSingle();
      if (data) return { plan: data.subscription || "free", count: data.vision_requests_count || 0 };
    }
    if (userId) {
      const { data } = await supabase
        .from("profiles")
        .select("subscription, vision_requests_count")
        .eq("id", userId)
        .maybeSingle();
      if (data) return { plan: data.subscription || "free", count: data.vision_requests_count || 0 };
    }
  } catch (e) {
    console.error("Subscription check failed:", e);
  }
  return { plan: "free", count: 0 };
}

async function incrementCount(supabase: any, telegramId: number | undefined, userId: string | undefined) {
  try {
    if (telegramId) {
      await supabase.rpc("increment_vision_count_by_tg", { tg_id: telegramId });
    } else if (userId) {
      await supabase.rpc("increment_vision_count", { uid: userId });
    }
  } catch (e) {
    // Fallback: direct update
    try {
      if (telegramId) {
        const { data } = await supabase.from("profiles").select("vision_requests_count").eq("telegram_id", telegramId).maybeSingle();
        const current = data?.vision_requests_count || 0;
        await supabase.from("profiles").update({ vision_requests_count: current + 1 }).eq("telegram_id", telegramId);
      }
    } catch {}
  }
}

async function callOpenRouter(image: string, message: string, lang: string): Promise<any> {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const userPrompt = `Язык ответа: ${lang}.\nЗапрос пользователя: ${message || "Проанализируй изображение"}\n\nВерни JSON с полями: ocr_text, translation, explanation, address, document_type.`;

  const body = {
    model: MODEL,
    temperature: 0.3,
    max_tokens: 2000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: image } },
        ],
      },
    ],
  };

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
        "X-Title": "VaxtaGo Vision",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") throw new Error("Vision timeout (30s)");
    throw err;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter HTTP ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty vision response");

  // Try to parse JSON from response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { ocr_text: content, translation: "", explanation: content, address: "", document_type: "unknown" };
  } catch {
    return { ocr_text: content, translation: "", explanation: content, address: "", document_type: "unknown" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let body: VisionBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
  }

  const { image, message, language_code, telegram_id, user_id, request_type } = body;
  if (!image) {
    return new Response(JSON.stringify({ success: false, error: "Image required" }), { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const effectiveUserId = telegram_id ? `tg_${telegram_id}` : (user_id ?? "anonymous");
  const lang = language_code || detectLanguage(message || "", language_code);
  const startTime = Date.now();

  // Check subscription / limits
  const { plan, count } = await checkSubscription(supabase, telegram_id, user_id);
  if (plan === "free" && count >= FREE_MONTHLY_LIMIT) {
    return new Response(JSON.stringify({
      success: false,
      error: "Лимит Vision анализов исчерпан (10/месяц). Подключите Premium.",
      limit_reached: true,
    }), { headers: corsHeaders, status: 200 });
  }

  let result: any;
  try {
    result = await callOpenRouter(image, message || "", lang);
  } catch (error) {
    console.error("Vision AI failed:", error);
    logRequest({ user: effectiveUserId, task: "vision", duration_ms: Date.now() - startTime, success: false, error: error instanceof Error ? error.message : "unknown" });
    return new Response(JSON.stringify({
      success: false,
      error: "Vaxta AI временно занят. Попробуйте ещё раз.",
    }), { headers: corsHeaders, status: 200 });
  }

  // Save request
  try {
    await supabase.from("vision_requests").insert({
      user_id: user_id ?? null,
      image_url: image.slice(0, 100), // store truncated for privacy
      request_type: request_type ?? "analyze",
      result: JSON.stringify(result),
      language: lang,
      created_at: new Date().toISOString(),
    });
    await incrementCount(supabase, telegram_id, user_id);
  } catch (e) {
    console.error("Failed to save vision request:", e);
  }

  logRequest({ user: effectiveUserId, task: "vision", model: MODEL, provider: "openrouter", duration_ms: Date.now() - startTime, success: true });

  return new Response(JSON.stringify({
    success: true,
    ...result,
    language: lang,
    model: MODEL,
  }), { headers: corsHeaders, status: 200 });
});
