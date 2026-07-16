/// <reference path="../deno-env.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { processTelegramMessage, processCallbackQuery } from "./handlers.ts";

serve(async (req) => {
  console.log("\nWEBHOOK RECEIVED");

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const telegramSecret = req.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = Deno.env.get("TELEGRAM_SECRET_TOKEN") ?? "vaxtago120726bizba18032015Nik";

  if (!telegramSecret || !expectedSecret || telegramSecret !== expectedSecret) {
    console.log("Secret validation failed");
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json();
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (body?.callback_query) {
      const cbPromise = processCallbackQuery(body, supabase, botToken!);
      if (typeof (globalThis as any).EdgeRuntime?.waitUntil === "function") {
        (globalThis as any).EdgeRuntime.waitUntil(cbPromise);
      } else {
        cbPromise.catch((e) => console.error("Callback error:", e));
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (body?.message) {
      console.log("INCOMING MESSAGE:", JSON.stringify(body.message));
    }

    const processingPromise = processTelegramMessage(body, supabase, botToken!);
    if (typeof (globalThis as any).EdgeRuntime?.waitUntil === "function") {
      (globalThis as any).EdgeRuntime.waitUntil(processingPromise);
    } else {
      processingPromise.catch((e) => console.error("Background error:", e));
    }
  } catch (e) {
    console.error("Handler error:", e);
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});