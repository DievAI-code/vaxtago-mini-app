/// <reference path="../deno-env.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const { code, user_phone } = await req.json();

    // Секретный код основателя (не светится в коде фронтенда)
    const FOUNDER_CODE = "31975";

    if (code !== FOUNDER_CODE) {
      return new Response(JSON.stringify({ success: false, error: "INVALID_CODE" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Находим пользователя по телефону и назначаем роль founder
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id, role")
      .eq("phone_number", user_phone)
      .single();

    if (userErr || !user) throw new Error("User not found");

    // Обновляем роль до founder (если еще не назначена)
    await supabase.from("users").update({ role: 'founder' }).eq("id", user.id);

    // Создаем сессию
    const token = crypto.randomUUID();
    const { data: session, error: sessErr } = await supabase
      .from("admin_sessions")
      .insert({
        user_id: user.id,
        role: 'founder',
        token: token
      })
      .select()
      .single();

    if (sessErr) throw sessErr;

    // Записываем вход в логи
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action: 'founder_login',
      details: { ip: req.headers.get("x-forwarded-for") }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      admin_token: token,
      role: 'founder'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});