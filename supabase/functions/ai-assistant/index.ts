/// <reference path="../deno-env.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createAIRequest } from "../_shared/ai-router.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-init-data",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { message, language_code, history, user_phone, model } = await req.json();

    if (!message || !user_phone) {
      throw new Error("Missing required fields");
    }

    // 1. Получаем профиль пользователя и проверяем лимиты
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id, subscription_status, ai_requests_used")
      .eq("phone_number", user_phone)
      .single();

    if (userErr || !user) throw new Error("User not found");

    const isPremium = user.subscription_status === "premium";
    const today = new Date().toISOString().split('T')[0];

    // Проверка дневного лимита для FREE пользователей
    if (!isPremium) {
      const { count } = await supabase
        .from("assistant_messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "user")
        .gte("created_at", today);

      if (count && count >= 10) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "LIMIT_EXCEEDED",
          message: "Daily limit reached (10/10). Upgrade to Premium for unlimited access." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // 2. Вызов AI через Router (OpenRouter)
    const aiResult = await createAIRequest({
      type: "assistant",
      text: message,
      language: language_code,
      userId: user.id,
      previousMessages: history || [],
      // Если модель передана с фронта, используем её, иначе gpt-4o-mini
      context: model || "openai/gpt-4o-mini" 
    });

    // 3. Сохраняем в историю (assistant_messages)
    // Сохраняем запрос пользователя
    await supabase.from("assistant_messages").insert({
      user_id: user.id,
      role: "user",
      content: message,
      language: language_code
    });

    // Сохраняем ответ ассистента
    await supabase.from("assistant_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: aiResult.text,
      language: language_code,
      model_used: aiResult.model
    });

    return new Response(JSON.stringify({ 
      success: true, 
      reply: aiResult.text,
      model: aiResult.model
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[AI Assistant Error]", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});