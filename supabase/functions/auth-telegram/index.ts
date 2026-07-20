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

  let body: any;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const now = new Date().toISOString();

  // Phone update flow
  if (body.update_phone) {
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", body.telegram_id)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from("users")
        .update({ phone_number: body.phone_number })
        .eq("telegram_id", body.telegram_id)
        .select()
        .single();
      
      if (!error) {
        return new Response(JSON.stringify({ success: true, user: updated }), { headers: corsHeaders, status: 200 });
      }
    }
    return new Response(JSON.stringify({ success: false, error: "User not found" }), { headers: corsHeaders, status: 404 });
  }

  // Login flow
  const { telegram_id, first_name, last_name, username, photo_url, device, browser } = body;

  if (!telegram_id) {
    return new Response(JSON.stringify({ success: false, error: "telegram_id required" }), { status: 400, headers: corsHeaders });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegram_id)
    .maybeSingle();

  let profile = existing;
  if (!existing) {
    const { data: inserted, error } = await supabase
      .from("users")
      .insert({
        telegram_id,
        username: username ?? null,
        first_name: first_name ?? null,
        last_name: last_name ?? null,
        photo_url: photo_url ?? null,
        language_code: "ru",
        created_at: now,
      })
      .select()
      .single();
    if (!error) profile = inserted;
  } else {
    const { data: updated, error } = await supabase
      .from("users")
      .update({
        username: username ?? existing.username,
        first_name: first_name ?? existing.first_name,
        last_name: last_name ?? existing.last_name,
        photo_url: photo_url ?? existing.photo_url,
      })
      .eq("telegram_id", telegram_id)
      .select()
      .single();
    if (!error) profile = updated;
  }

  const token = btoa(`${telegram_id}:${now}`);
  return new Response(JSON.stringify({ success: true, user: profile, token }), { headers: corsHeaders, status: 200 });
});