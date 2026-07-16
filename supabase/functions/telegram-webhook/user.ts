import type { Lang, TelegramFrom } from "./types.ts";
import { detectLanguage } from "./utils.ts";

export async function getOrCreateUser(supabase: any, from: TelegramFrom): Promise<any> {
  const userId = from.id;
  const { data, error } = await supabase
    .from("telegram_users")
    .select("*")
    .eq("telegram_id", userId)
    .maybeSingle();

  if (data) return data;

  const newUser = {
    telegram_id: userId,
    username: from.username || null,
    first_name: [from.first_name, from.last_name].filter(Boolean).join(" ") || null,
    language: detectLanguage("", from.language_code),
    subscription_status: "FREE",
    premium: false,
    last_image_text: null,
    last_ocr_text: null,
    translation_state: null,
    last_translation: null,
    selected_language: null,
    document_scan_state: null,
    created_at: new Date().toISOString(),
    last_activity: new Date().toISOString(),
  };

  const { data: inserted, error: insertError } = await supabase
    .from("telegram_users")
    .insert(newUser)
    .select()
    .maybeSingle();

  if (insertError) console.error("❌ User insert error:", insertError.message);
  return inserted || newUser;
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