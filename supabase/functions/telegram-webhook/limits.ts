import type { Lang } from "./types.ts";

export const FREE_LIMITS = {
  ai_requests: 3,
  vacancy_searches: Infinity,
  translations: 3,
  document_scans: 3,
  employer_checks: 3,
  routes: Infinity,
  info: Infinity,
};

export type LimitType = keyof typeof FREE_LIMITS;

export async function ensureDailyRow(supabase: any, telegramId: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("user_limits")
    .select("telegram_id")
    .eq("telegram_id", telegramId)
    .eq("date", today)
    .maybeSingle();
  if (!data) {
    await supabase.from("user_limits").insert({
      telegram_id: telegramId,
      date: today,
      ai_requests: 0,
      vacancy_searches: 0,
      translations: 0,
      document_scans: 0,
      employer_checks: 0,
      routes: 0,
      info: 0,
    });
  }
}

export async function getTodayUsage(supabase: any, telegramId: number): Promise<Record<string, number>> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("user_limits")
    .select("*")
    .eq("telegram_id", telegramId)
    .eq("date", today)
    .maybeSingle();
  return data ?? {
    ai_requests: 0, vacancy_searches: 0, translations: 0, document_scans: 0, employer_checks: 0, routes: 0, info: 0,
  };
}

export async function checkAndIncrement(
  supabase: any,
  telegramId: number,
  type: LimitType,
  status: string,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (status === "PREMIUM") return { allowed: true, used: 0, limit: Infinity };
  await ensureDailyRow(supabase, telegramId);
  const usage = await getTodayUsage(supabase, telegramId);
  const used = (usage[type] as number) ?? 0;
  const limit = FREE_LIMITS[type];
  if (used >= limit) return { allowed: false, used, limit };

  await supabase
    .from("user_limits")
    .update({ [type]: used + 1 })
    .eq("telegram_id", telegramId)
    .eq("date", new Date().toISOString().slice(0, 10));
  return { allowed: true, used: used + 1, limit };
}

export function limitMessage(lang: Lang): string {
  const msgs: Record<string, string> = {
    ru: "💎 Вы использовали дневной лимит бесплатного тарифа.\n\nПодключите VaxtaGo Premium, чтобы снять ограничения.",
    uz: "💎 Bepul tarifning kunlik limitidan foydalandingiz.\n\nCheklovlarni olib tashlash uchun VaxtaGo Premium ulang.",
  };
  return msgs[lang] ?? msgs.ru;
}