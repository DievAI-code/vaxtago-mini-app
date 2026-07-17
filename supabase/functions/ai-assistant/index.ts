/// <reference path="../deno-env.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createAIRequest } from "../_shared/ai-router.ts";
import { logRequest } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_HISTORY_MESSAGES = 20;

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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let userId: string | null = null;
  if (token !== serviceRoleKey) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    userId = user.id;
  }

  const { user_id, message, language_code, telegram_id, image, context } = await req.json();
  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Message required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const effectiveUserId = user_id ?? userId;
  const lang = language_code || detectLanguage(message);
  const history = await fetchConversationHistory(supabase, effectiveUserId);
  const contextText = [...history.map((h) => `${h.role}: ${h.content}`), `user: ${message}`].join("\n");

  let reply: string;
  let model = "none";
  try {
    const aiResult = await createAIRequest({
      type: image ? "vision" : "assistant",
      text: contextText,
      image,
      language: lang,
      userId: effectiveUserId,
    });
    reply = aiResult.text;
    model = aiResult.model;
  } catch (error) {
    console.error("AI Router failed:", error);
    reply = "⚠️ AI временно переключается на резервный сервер. Попробуйте позже.";
  }

  // Save to assistant_messages
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
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (e) {
    console.error("Failed to save history:", e);
  }

  return new Response(JSON.stringify({ reply, model, language: lang }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});