import type { Lang, TelegramFrom } from "./types.ts";
import { detectLanguage } from "./utils.ts";

export async function getOrCreateUser(supabase: any, from: TelegramFrom): Promise<any> {
  const userId = from.id;
  const lang = detectLanguage("", from.language_code);

  const userRecord = {
    telegram_id: userId,
    username: from.username || null,
    first_name: [from.first_name, from.last_name].filter(Boolean).join(" ") || null,
    language: lang,
    subscription_status: "FREE",
    premium: false,
    last_activity: new Date().toISOString(),
  };

  // Upsert avoids race condition between SELECT + INSERT
  const { data, error } = await supabase
    .from("telegram_users")
    .upsert(userRecord, { onConflict: "telegram_id" })
    .select()
    .maybeSingle();

  if (error) {
    console.error("❌ User upsert error:", error.message);
    return userRecord;
  }
  return data || userRecord;
}

export async function setLanguage(supabase: any, userId: number, lang: string): Promise<void> {
  await supabase
    .from("telegram_users")
    .update({ language: lang, last_activity: new Date().toISOString() })
    .eq("telegram_id", userId);
}

export async function updateUserFields(supabase: any, userId: number, fields: Record<string, any>): Promise<void> {
  await supabase
    .from("telegram_users")
    .update({ ...fields, last_activity: new Date().toISOString() })
    .eq("telegram_id", userId);
}

export async function getSubscriptionStatus(supabase: any, userId: number): Promise<string> {
  const { data } = await supabase
    .from("telegram_users")
    .select("subscription_status, premium")
    .eq("telegram_id", userId)
    .maybeSingle();
  if (data?.premium) return "PREMIUM";
  return data?.subscription_status ?? "FREE";
}

export async function isPremiumActive(supabase: any, userId: number): Promise<boolean> {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("telegram_id", userId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (data) return true;
  const { data: user } = await supabase
    .from("telegram_users")
    .select("premium")
    .eq("telegram_id", userId)
    .maybeSingle();
  return !!user?.premium;
}