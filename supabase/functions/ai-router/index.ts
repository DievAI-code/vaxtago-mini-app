/// <reference path="../deno-env.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_MODEL = "google/gemini-2.5-flash";

function getApiKey(): string | undefined {
  return Deno.env.get("OPENROUTER_API_KEY");
}

function detectTask(input: string, hasImage: boolean): string {
  const low = input.toLowerCase();
  if (hasImage) return "vision";
  if (low.includes("перевед") || low.includes("translate") || low.includes("перевод")) return "translation";
  if (low.includes("работ") || low.includes("ваканс") || low.includes("job") || low.includes("иш")) return "vacancy";
  if (low.includes("проверь работодателя") || low.includes("employer") || low.includes("проверка")) return "employer_check";
  if (low.includes("паспорт") || low.includes("договор") || low.includes("документ") || low.includes("разрешение") || low.includes("document") || low.includes("contract")) return "document";
  return "assistant";
}

async function callAI(messages: any[]): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": Deno.env.get("APP_DOMAIN") ?? "https://vaxtago.app",
      "X-Title": "VaxtaGo",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.7,
      max_tokens: 1500,
      messages,
      provider: { allow_fallbacks: true },
    }),
  });

  if (!response.ok) throw new Error(`AI HTTP ${response.status}`);
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty AI response");
  return text.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  console.log("AI ROUTER START");

  try {
    const { type, user_id, message, image } = await req.json();
    console.log("INPUT TYPE:", type);

    const task = detectTask(message || "", !!image);
    console.log("TASK DETECTED:", task);

    const systemPrompts: Record<string, string> = {
      assistant: "Ты AI помощник VaxtaGo для мигрантов в России. Отвечай на языке пользователя.",
      vision: "Распознай текст на изображении и проанализируй документ. Отвечай понятно.",
      translation: "Переведи текст на указанный язык. Сохраняй смысл.",
      document: "Проанализируй документ и объясни простым языком.",
      vacancy: "Помоги найти работу. Учитывай риски и реальный доход.",
      employer_check: "Проверь работодателя. Дай оценку риска.",
    };

    const messages = [
      { role: "system", content: systemPrompts[task] },
      { role: "user", content: image ? [{ type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }, { type: "text", text: message }] : message },
    ];

    console.log("HANDLER START");
    const reply = await callAI(messages);
    console.log("HANDLER SUCCESS");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (user_id && user_id !== "anonymous") {
      await supabase.from("assistant_messages").insert([
        { user_id, role: "user", content: message || "(image)", channel: "mini_app" },
        { user_id, role: "assistant", content: reply, channel: "mini_app" },
      ]);
    }

    console.log("MESSAGE SENT");
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("AI ROUTER ERROR:", error);
    return new Response(
      JSON.stringify({ reply: "Извините, функция временно недоступна. Попробуйте позже." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } finally {
    console.log("AI ROUTER COMPLETE");
  }
});