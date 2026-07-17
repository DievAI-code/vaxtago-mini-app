/// <reference path="../deno-env.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createAIRequest, detectIntent, getActionForIntent } from "../_shared/ai-router.ts";
import { logRequest } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-init-data",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const MAX_HISTORY_MESSAGES = 10;

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

async function fetchConversationHistory(supabase: any, userId: string): Promise<Array<{ role: string; content: string }>> {
  try {
    const { data, error } = await supabase
      .from("assistant_messages")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(MAX_HISTORY_MESSAGES);
    if (error) return [];
    return (data || []).map((msg: any) => ({ role: msg.role, content: msg.content }));
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("AI ASSISTANT REQUEST");
  console.log("ORIGIN:", req.headers.get("Origin"));

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: corsHeaders },
    );
  }

  const { message, language_code, telegram_id, image, image_url, context, user_id, has_image, init_data } = body;

  if (!message || typeof message !== "string") {
    return new Response(
      JSON.stringify({ success: false, error: "Message required" }),
      { status: 400, headers: corsHeaders },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const effectiveUserId = telegram_id ? `tg_${telegram_id}` : (user_id ?? "anonymous");
  const lang = language_code || detectLanguage(message);
  const history = await fetchConversationHistory(supabase, effectiveUserId);
  const intent = detectIntent(message, !!image || !!has_image, history);
  const action = getActionForIntent(intent);

  let reply: string;
  let model = "none";
  try {
    const aiResult = await createAIRequest({
      type: image || image_url ? "vision" : "assistant",
      text: message,
      image,
      imageUrl: image_url,
      hasImage: !!image || !!has_image,
      language: lang,
      userId: effectiveUserId,
      context: context ?? "chat",
      previousMessages: history,
    });
    reply = aiResult.text;
    model = aiResult.model;
  } catch (error) {
    console.error("AI Router failed:", error);
    return new Response(
      JSON.stringify({ success: false, error: "AI временно недоступен. Попробуйте позже." }),
      { headers: corsHeaders, status: 200 },
    );
  }

  // Fire-and-forget history save
  (async () => {
    try {
      await supabase.from("assistant_messages").insert([
        {
          user_id: effectiveUserId,
          telegram_id: telegram_id ?? null,
          role: "user",
          content: message,
          language: lang,
          context: context ?? "chat",
          created_at: new Date().toISOString(),
        },
        {
          user_id: effectiveUserId,
          telegram_id: telegram_id ?? null,
          role: "assistant",
          content: reply,
          language: lang,
          model: model,
          context: context ?? "chat",
          intent: intent,
          action: action,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  })();

  const responseData = {
    success: true,
    message: reply,
    intent,
    action,
    reply,
    model,
    language: lang,
  };

  console.log("AI ASSISTANT RESPONSE:", JSON.stringify(responseData));

  return new Response(
    JSON.stringify(responseData),
    { headers: corsHeaders, status: 200 },
  );
});