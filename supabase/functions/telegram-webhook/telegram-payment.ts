/// <reference path="../deno-env.d.ts" />
import type { Lang, LabeledPrice } from "./types.ts";

const PREMIUM_PRICE_UZS = 9900000; // 99 000.00 UZS (в минимальных единицах валюты)

export async function createPremiumInvoice(
  chatId: number,
  botToken: string,
  lang: Lang,
  providerToken: string,
): Promise<void> {
  const title = "⭐ VAQTA AI Premium";
  const descriptions: Record<string, string> = {
    ru: "Полный доступ к AI помощнику, анализу документов и проверке работодателей на 30 дней.",
    uz: "AI yordamchi, hujjatlar tahlili va ish beruvchilarni tekshirishga 30 kunlik to'liq kirish.",
    tg: "Дастрасии комил ба ёвари AI, таҳлили ҳуҷҷатҳо ва санҷиши корфармоён барои 30 рӯз.",
    ky: "30 күндүн ичинде AI жардамчысына, документтерди талдоого жана иш берүүчүлөрдү текшерүүгө толук мүмкүнчүлүк.",
    en: "Full access to AI assistant, document analysis, and employer verification for 30 days.",
  };

  const prices: LabeledPrice[] = [
    { label: "Premium 30 дней", amount: PREMIUM_PRICE_UZS },
  ];

  console.log(`[PAYMENT] Creating invoice for ${chatId}`);

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendInvoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      title,
      description: descriptions[lang] || descriptions.ru,
      payload: `premium_${chatId}`,
      provider_token: providerToken,
      currency: "UZS",
      prices,
      start_parameter: "premium_access",
    }),
  });

  if (!res.ok) {
    console.error("[PAYMENT FAILED] sendInvoice error:", await res.text());
  } else {
    console.log("[PAYMENT INVOICE CREATED]", { chatId });
  }
}

export async function answerPreCheckoutQuery(botToken: string, queryId: string, ok: boolean = true) {
  await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pre_checkout_query_id: queryId,
      ok,
      error_message: ok ? undefined : "Произошла ошибка при проверке платежа. Попробуйте позже.",
    }),
  });
}

export async function activatePremiumSubscription(
  supabase: any,
  telegramId: number,
  paymentData: any
): Promise<void> {
  const chargeId = paymentData.telegram_payment_charge_id;
  const amount = paymentData.total_amount / 100;
  
  // 1. Проверяем текущую подписку
  const { data: current } = await supabase
    .from("subscriptions")
    .select("expires_at")
    .eq("telegram_id", telegramId)
    .eq("status", "active")
    .maybeSingle();

  let newExpiry = new Date();
  if (current && new Date(current.expires_at) > new Date()) {
    newExpiry = new Date(current.expires_at);
  }
  newExpiry.setDate(newExpiry.getDate() + 30);

  // 2. Записываем платеж
  await supabase.from("subscriptions").insert({
    telegram_id: telegramId,
    status: "active",
    payment_id: chargeId,
    amount: amount,
    expires_at: newExpiry.toISOString(),
  });

  // 3. Обновляем пользователя
  await supabase.from("telegram_users").update({
    premium: true,
    subscription_status: "PREMIUM"
  }).eq("telegram_id", telegramId);

  console.log("[PAYMENT SUCCESS / PREMIUM ACTIVATED]", { telegramId, amount, chargeId });
}