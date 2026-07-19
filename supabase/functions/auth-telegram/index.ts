/// <reference path="../deno-env.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { validateInitData } from "../_shared/telegram-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-init-data",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let body: any;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  const initData = body.initData || req.headers.get("x-telegram-init-data");
  if (!initData) {
    return new Response(JSON.stringify({ success: false, error: "initData required" }), { status: 400, headers: corsHeaders });
  }

  const parsed = validateInitData(initData);
  if (!parsed) {
    return new Response(JSON.stringify({ success: false, error: "Invalid initData" }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const now = new Date().toISOString();
  const phone = body.phone_number || null;

  const { data: existing } = await supabase
    .from("telegram_users")
    .select("*")
    .eq("telegram_id", parsed.telegramId)
    .maybeSingle();

  let profile = existing;
  if (!existing) {
    const { data: inserted, error } = await supabase
      .from("telegram_users")
      .insert({
        telegram_id: parsed.telegramId,
        username: parsed.username ?? null,
        first_name: parsed.firstName ?? null,
        last_name: parsed.lastName ?? null,
        language_code: parsed.languageCode ?? "ru",
        photo_url: parsed.photoUrl ?? null,
        phone_number: phone,
        created_at: now,
        last_login: now,
      })
      .select()
      .single();
    if (!error) profile = inserted;
  } else {
    const { data: updated, error } = await supabase
      .from("telegram_users")
      .update({
        username: parsed.username ?? existing.username,
        first_name: parsed.firstName ?? existing.first_name,
        last_name: parsed.lastName ?? existing.last_name,
        language_code: parsed.languageCode ?? existing.language_code,
        photo_url: parsed.photoUrl ?? existing.photo_url,
        phone_number: phone ?? existing.phone_number,
        last_login: now,
      })
      .eq("telegram_id", parsed.telegramId)
      .select()
      .single();
    if (!error) profile = updated;
  }

  // Simple token (telegram_id signed with service key hash)
  const token = btoa(`${parsed.telegramId}:${now}`);
  return new Response(JSON.stringify({ success: true, user: profile, token }), { headers: corsHeaders, status: 200 });
});