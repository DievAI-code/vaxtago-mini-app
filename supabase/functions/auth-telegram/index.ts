/// <reference path="../deno-env.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { validateInitData } from "../_shared/telegram-auth.ts";
import { createHmac, createHash } from "https://deno.land/std@0.190.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-init-data",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

function verifyTelegramHash(data: Record<string, any>): boolean {
  const hash = data.hash;
  if (!hash) return false;

  const secretKey = createHash("sha256").update(BOT_TOKEN).digest();
  const checkString = Object.keys(data)
    .filter((key) => key !== "hash")
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("\n");

  const computedHash = createHmac("sha256", secretKey).update(checkString).digest("hex");
  return computedHash === hash;
}

function isAuthDateValid(authDate: number): boolean {
  if (!authDate) return false;
  const now = Math.floor(Date.now() / 1000);
  // Allow 24 hours tolerance
  return now - authDate <= 86400;
}

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
        .update({ phone_number: body.phone_number, updated_at: now })
        .eq("telegram_id", body.telegram_id)
        .select()
        .single();
      if (!error) return new Response(JSON.stringify({ success: true, user: updated }), { headers: corsHeaders, status: 200 });
    }
    return new Response(JSON.stringify({ success: false, error: "User not found" }), { headers: corsHeaders, status: 404 });
  }

  // Mini App flow (initData)
  const initData = body.initData || req.headers.get("x-telegram-init-data");
  if (initData) {
    const parsed = validateInitData(initData);
    if (!parsed) {
      return new Response(JSON.stringify({ success: false, error: "Invalid initData" }), { status: 401, headers: corsHeaders });
    }
    return finalizeUser(supabase, {
      telegram_id: parsed.telegramId,
      username: parsed.username,
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      photo_url: parsed.photoUrl,
      language_code: parsed.languageCode,
    }, now);
  }

  // Telegram Login Widget flow (hash)
  const { telegram_id, first_name, last_name, username, photo_url, language_code, hash, auth_date } = body;
  if (!telegram_id || !hash) {
    return new Response(JSON.stringify({ success: false, error: "telegram_id and hash required" }), { status: 400, headers: corsHeaders });
  }

  if (!verifyTelegramHash(body)) {
    return new Response(JSON.stringify({ success: false, error: "Invalid hash" }), { status: 401, headers: corsHeaders });
  }

  if (!isAuthDateValid(Number(auth_date))) {
    return new Response(JSON.stringify({ success: false, error: "auth_date expired" }), { status: 401, headers: corsHeaders });
  }

  return finalizeUser(supabase, {
    telegram_id,
    first_name,
    last_name,
    username,
    photo_url,
    language_code: language_code || "ru",
  }, now);
});

async function finalizeUser(supabase: any, u: any, now: string) {
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", u.telegram_id)
    .maybeSingle();

  let profile = existing;
  if (!existing) {
    const { data: inserted, error } = await supabase
      .from("users")
      .insert({
        telegram_id: u.telegram_id,
        username: u.username ?? null,
        first_name: u.first_name ?? null,
        last_name: u.last_name ?? null,
        photo_url: u.photo_url ?? null,
        language_code: u.language_code ?? "ru",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (!error) profile = inserted;
  } else {
    const { data: updated, error } = await supabase
      .from("users")
      .update({
        username: u.username ?? existing.username,
        first_name: u.first_name ?? existing.first_name,
        last_name: u.last_name ?? existing.last_name,
        photo_url: u.photo_url ?? existing.photo_url,
        language_code: u.language_code ?? existing.language_code,
        updated_at: now,
      })
      .eq("telegram_id", u.telegram_id)
      .select()
      .single();
    if (!error) profile = updated;
  }

  const token = btoa(`${u.telegram_id}:${now}`);
  return new Response(JSON.stringify({ success: true, user: profile, token }), { headers: corsHeaders, status: 200 });
}