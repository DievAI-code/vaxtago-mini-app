/// <reference path="../deno-env.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const { image, target_lang, user_phone } = await req.json();

    if (!image || !user_phone) throw new Error("Missing data");

    // 1. Проверка пользователя и лимитов
    const { data: user } = await supabase
      .from("users")
      .select("id, subscription_status")
      .eq("phone_number", user_phone)
      .single();

    if (!user) throw new Error("User not found");

    if (user.subscription_status !== 'premium') {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from("ocr_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today);

      if (count && count >= 5) {
        return new Response(JSON.stringify({ error: "LIMIT_REACHED" }), { 
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
    }

    // 2. Запрос к OpenRouter (Vision)
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `Распознай весь текст на изображении. Затем переведи его на язык: ${target_lang}. Верни результат строго в формате JSON: {"original": "...", "translated": "..."}` },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const result = JSON.parse(content.replace(/```json|```/g, ""));

    // 3. Сохранение в историю
    await supabase.from("ocr_history").insert({
      user_id: user.id,
      original_text: result.original,
      translated_text: result.translated,
      target_language: target_lang
    });

    return new Response(JSON.stringify({ 
      success: true, 
      original: result.original, 
      translated: result.translated 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});