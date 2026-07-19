import type { Lang } from "./types.ts";

export type Plan = "FREE" | "PREMIUM";

export const LIMITS = {
  FREE: { ai_requests: 20, translations: 5, job_searches: 10 },
  PREMIUM: { ai_requests: Infinity, translations: Infinity, job_searches: Infinity },
};

export type LimitType = "ai_requests" | "translations" | "job_searches";

export async function ensureSubscription(supabase: any, telegramId: number): Promise<void> {
  const { data } = await supabase
    .from("subscriptions")
    .select("telegram_id")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  if (!data) {
    await supabase.from("subscriptions").insert({
      telegram_id: telegramId,
      plan: "FREE",
      status: "active",
      created_at: new Date().toISOString(),
      expires_at: null,
    });
  }
}

export async function checkSubscription(supabase: any, telegramId: number): Promise<Plan> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, expires_at")
    .eq("telegram_id", telegramId)
    .eq("status", "active")
    .maybeSingle();

  if (data?.plan === "PREMIUM") {
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabase
        .from("subscriptions")
        .update({ plan: "FREE", status: "expired" })
        .eq("telegram_id", telegramId);
      return "FREE";
    }
    return "PREMIUM";
  }
  return "FREE";
}

export async function checkAndIncrementLimit(
  supabase: any,
  telegramId: number,
  type: LimitType,
): Promise<{ allowed: boolean; remaining: number }> {
  const plan = await checkSubscription(supabase, telegramId);
  const limit = LIMITS[plan][type];
  if (limit === Infinity) return { allowed: true, remaining: Infinity };

  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("daily_usage")
    .select("*")
    .eq("telegram_id", telegramId)
    .eq("usage_date", today)
    .maybeSingle();

  const used = (data?.[type] as number) ?? 0;
  if (used >= limit) {
    return { allowed: false, remaining: 0 };
  }

  if (data) {
    await supabase
      .from("daily_usage")
      .update({ [type]: used + 1 })
      .eq("telegram_id", telegramId)
      .eq("usage_date", today);
  } else {
    const insertObj: any = {
      telegram_id: telegramId,
      usage_date: today,
      ai_requests: 0,
      translations: 0,
      job_searches: 0,
    };
    insertObj[type] = 1;
    await supabase.from("daily_usage").insert(insertObj);
  }
  return { allowed: true, remaining: limit - used - 1 };
}

export function limitMessage(lang: Lang, type: LimitType): string {
  const labels: Record<LimitType, string> = {
    ai_requests: "AI-запросов",
    translations: "переводов",
    job_searches: "поиска вакансий",
  };
  const msgs: Record<string, string> = {
    ru: `Ваш дневной лимит ${labels[type]} исчерпан (FREE: ${LIMITS.FREE[type]}). Оформите VaxtaGo PREMIUM для безлимита.`,
    uz: `Kunlik limit tugadi. VaxtaGo PREMIUM oling.`,
  };
  return msgs[lang] ?? msgs.ru;
}
