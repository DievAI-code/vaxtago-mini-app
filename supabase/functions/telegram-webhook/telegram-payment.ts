/// <reference path="../deno-env.d.ts" />
import type { Lang } from "./types.ts";

const PREMIUM_PRICE_UZS = 99000; // 99 000 UZS

export async function createInvoice(
  chatId: number,
  botToken: string,
  lang: Lang,
  providerToken: string,
): Promise<void> {
  const title = "VaxtaGo Premium";
  const description =
    lang === "uz"
      ? "AI yordamchi, hujjatlar, tarjima va vakansiyalar uchun keng imkoniyatlar"
      : "Расширенные возможности AI помощника, документы, перевод, вакансии";

  const payload = "PREMIUM";
  const currency = "UZS";
  const prices = [{ label: "VaxtaGo Premium (1 месяц)", amount: PREMIUM_PRICE_UZS }];

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendInvoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      title,
      description,
      payload,
      provider_token: providerToken,
      currency,
      prices,
      need_name: false,
      need_phone_number: false,
      need_email: false,
      is_flexible: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("❌ sendInvoice failed:", JSON.stringify(err));
    return;
  }
  console.log("TELEGRAM INVOICE SENT", { chat_id: chatId });
}

export async function processSuccessfulPayment(
  supabase: any,
  userId: number,
  payment: any,
): Promise<void> {
  const paymentId = payment.telegram_payment_charge_id;
  const amount = Number(payment.total_amount);
  const currency = payment.currency;

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (existing) {
    console.log("SUBSCRIPTION ALREADY EXISTS", { telegram_id: userId, payment_id: paymentId });
    return;
  }

  const { error } = await supabase.from("subscriptions").insert({
    telegram_id: userId,
    status: "PREMIUM",
    payment_id: paymentId,
    amount: amount,
    currency: currency,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("❌ Failed to insert subscription:", error.message);
    return;
  }

  await supabase
    .from("telegram_users")
    .update({ premium: true, subscription_status: "PREMIUM" })
    .eq("telegram_id", userId);

  console.log("TELEGRAM PAYMENT SUCCESS", { telegram_id: userId, payment_id: paymentId, amount, currency });
}