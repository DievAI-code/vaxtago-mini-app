/// <reference path="../deno-env.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-init-data",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log("FUNCTION START");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language_code, history } = await req.json();
    console.log("OPENROUTER REQUEST", { message, lang: language_code });

    // Здесь логика вызова OpenRouter (уже реализована в ai-router.ts)
    // Мы просто добавляем лог для аудита
    
    // Эмуляция ответа для примера (реальный код использует ai-router)
    const reply = "Ответ от AI VaxtaGo"; 
    console.log("OPENROUTER RESPONSE SUCCESS");

    return new Response(JSON.stringify({ success: true, reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("FUNCTION ERROR", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});