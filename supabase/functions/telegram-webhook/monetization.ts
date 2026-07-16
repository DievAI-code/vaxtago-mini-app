import type { Lang } from "./types.ts";

export interface PremiumStatus {
  premium: boolean;
  plan?: string;
  remaining_credits?: number;
}

export async function checkUserPremium(supabase: any, userId: number): Promise<PremiumStatus> {
  const now = new Date().toISOString();
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .gte("expires_at", now)
    .maybeSingle();

  if (sub) {
    return { premium: true, plan: sub.plan_id };
  }

  const { data: bal } = await supabase
    .from("ai_balance")
    .select("credits")
    .eq("user_id", userId)
    .maybeSingle();

  const credits = bal?.credits ?? 0;
  return { premium: false, remaining_credits: credits };
}

export async function ensureBalance(supabase: any, userId: number): Promise<void> {
  const { data } = await supabase
    .from("ai_balance")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) {
    await supabase
      .from("ai_balance")
      .insert({ user_id: userId, credits: 10, updated_at: new Date().toISOString() });
  }
}

export async function deductCredit(supabase: any, userId: number): Promise<boolean> {
  const { data: bal } = await supabase
    .from("ai_balance")
    .select("credits")
    .eq("user_id", userId)
    .maybeSingle();
  const credits = bal?.credits ?? 0;
  if (credits <= 0) return false;
  await supabase
    .from("ai_balance")
    .update({ credits: credits - 1, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  return true;
}

export function limitMessage(lang: Lang): string {
  const msgs: Record<string, string> = {
    ru: "Ваш бесплатный лимит закончился.\nОформите VaxtaGo PRO или купите пакет AI-запросов.",
    uz: "Bepul limit tugadi.\nVaxtaGo PRO yoki AI so'rovlar paketini sating.",
  };
  return msgs[lang] ?? msgs.ru;
}