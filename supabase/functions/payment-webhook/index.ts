/// <reference path="../deno-env.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token",
};

// Telegram Payments provider token — set in Edge Function env. No key connected yet.
const TELEGRAM_PROVIDER_TOKEN = Deno.env.get("TELEGRAM_PROVIDER_TOKEN") ?? "";

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

async function activateSubscription(supabase: any, userId: number, planId: string, paymentId: string, amount: number) {
  const durationDays = planId === "PREMIUM" ? 30 : 30;
  const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();
  await supabase.from("subscriptions").upsert({
    telegram_id: userId,
    plan: planId,
    status: "active",
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
  }, { onConflict: "telegram_id" });
  await supabase.from("payments").insert({
    user_id: userId, provider: "telegram", payment_id: paymentId, amount, currency: "EUR", status: "completed",
  });
  console.log("✅ Subscription activated for", userId, planId);
}

async function sendTelegramMessage(chatId: number, botToken: string, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function handleTelegramPayment(req: Request): Promise<Response> {
  const body = await req.json();
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
  const supabase = getSupabase();

  // Pre-checkout: confirm (provider token would be configured in BotFather payments)
  if (body.pre_checkout_query) {
    const id = body.pre_checkout_query.id;
    await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pre_checkout_query_id: id, ok: true }),
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  }

  // Successful payment
  const msg = body.message;
  if (msg?.successful_payment) {
    const payment = msg.successful_payment;
    const userId = msg.from.id;
    const planId = payment.invoice_payload === "PREMIUM" ? "PREMIUM" : "FREE";
    await activateSubscription(supabase, userId, planId, payment.telegram_payment_charge_id, Number(payment.total_amount) / 100);
    await sendTelegramMessage(userId, botToken, "✅ Оплата прошла успешно! VaxtaGo PREMIUM активирован.");
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: "Unknown" }), { status: 400, headers: corsHeaders });
}

async function handleStripeWebhook(req: Request): Promise<Response> {
  const sig = req.headers.get("stripe-signature");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!sig || !secret) return new Response("Missing signature", { status: 400 });

  const payload = await req.text();
  const event = JSON.parse(payload);
  const supabase = getSupabase();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = Number(session.metadata?.telegram_id);
    const planId = session.metadata?.plan_id === "PREMIUM" ? "PREMIUM" : "FREE";
    await activateSubscription(supabase, userId, planId, session.payment_intent, session.amount_total / 100);
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
    await sendTelegramMessage(userId, botToken, "✅ Оплата Stripe прошла! VaxtaGo PREMIUM активирован.");
  }
  return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  if (url.pathname.endsWith("/telegram")) return handleTelegramPayment(req);
  if (url.pathname.endsWith("/stripe")) return handleStripeWebhook(req);
  return new Response(JSON.stringify({ error: "Unknown endpoint" }), { status: 404, headers: corsHeaders });
});