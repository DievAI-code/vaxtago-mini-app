/// <reference path="../deno-env.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-init-data",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const body = await req.json();
    const { telegram_id, first_name, last_name, username, photo_url, language_code } = body;

    if (!telegram_id) throw new Error("Missing telegram_id");

    const now = new Date().toISOString();

    // Унифицированный UPSERT по telegram_id
    const { data, error } = await supabase
      .from("users")
      .upsert({
        telegram_id,
        first_name,
        last_name,
        username,
        avatar_url: photo_url, // маппинг photo_url -> avatar_url
        language_code: language_code || "uz",
        last_login: now,
        updated_at: now
      }, { 
        onConflict: 'telegram_id' 
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, user: data }), { 
      headers: corsHeaders, 
      status: 200 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      headers: corsHeaders, 
      status: 400 
    });
  }
});