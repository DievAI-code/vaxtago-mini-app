import type { Lang } from "./types.ts";

export function detectLanguage(text: string, telegramLanguageCode?: string): string {
  if (telegramLanguageCode) {
    const code = telegramLanguageCode.toLowerCase();
    if (code.startsWith("ru")) return "ru";
    if (code.startsWith("uz")) return "uz";
    if (code.startsWith("tg")) return "tg";
    if (code.startsWith("ky")) return "ky";
    if (code.startsWith("en")) return "en";
  }
  const low = text.toLowerCase();
  if (["salom", "ish", "yordam", "shartnoma"].some((x) => low.includes(x))) return "uz";
  if (["hello", "help", "job", "contract"].some((x) => low.includes(x))) return "en";
  if (["привет", "работ", "договор", "помощ"].some((x) => low.includes(x))) return "ru";
  if (/[а-яё]/i.test(text)) return "ru";
  return "ru";
}

export function extractCity(text: string): string | undefined {
  const cities = [
    "москва", "спб", "санкт-петербург", "казань", "новосибирск",
    "екатеринбург", "нижний новгород", "алматы", "астана", "краснодар",
    "сочи", "уфа", "самара", "омск", "челябинск", "ростов", "владивосток",
  ];
  const low = text.toLowerCase();
  for (const city of cities) {
    if (low.includes(city)) return city;
  }
  return undefined;
}

export function formatSalary(salary: any): string {
  if (!salary) return "Зарплата не указана";
  const currency = salary.currency === "RUR" ? "₽" : (salary.currency || "₽");
  if (salary.from && salary.to) return `${salary.from}–${salary.to} ${currency}`;
  if (salary.from) return `от ${salary.from} ${currency}`;
  if (salary.to) return `до ${salary.to} ${currency}`;
  return "Зарплата не указана";
}

export function detectIntent(
  text: string,
  history: Array<{ role: string; content: string }>,
): string {
  const low = text.toLowerCase();

  const professions = [
    "сварщик", "водитель", "разнорабочий", "электрик", "монтажник",
    "строитель", "welder", "driver", "worker", "electrician", "installer",
    "builder", "cabinet maker", "plumber", "mason", "painter",
  ];
  const vacancyWords = [
    "ваканс", "работ", "иш", "job", "vacancy", "ищу работ", "найти работ",
    "трудоустро", "помоги найти",
  ];

  if (professions.some((w) => low.includes(w))) return "VACANCY_SEARCH";
  if (vacancyWords.some((w) => low.includes(w))) return "VACANCY_SEARCH";

  const userMessages = history.filter((m) => m.role === "user");
  const lastUserMsg = userMessages[userMessages.length - 1];
  if (lastUserMsg) {
    const lastLow = lastUserMsg.content.toLowerCase();
    const lastWasVacancy =
      professions.some((w) => lastLow.includes(w)) ||
      vacancyWords.some((w) => lastLow.includes(w));
    if (lastWasVacancy && low.trim().length > 0) {
      const isGreeting = ["привет", "hello", "hi", "salom", "салом"].some((w) =>
        low.includes(w),
      );
      if (!isGreeting) return "VACANCY_SEARCH";
    }
  }

  if (
    ["миграц", "мвд", "регистрац", "патент", "виза", "миграционн", "migration", "police", "полиц"]
      .some((w) => low.includes(w))
  ) return "MIGRATION_HELP";

  if (
    ["перевод", "перевед", "translate", "документ", "договор", "contract", "ҳуҷҷат", "куҷҷат"]
      .some((w) => low.includes(w))
  ) return "DOCUMENT_TRANSLATION";

  if (
    ["закон", "право", "юрист", "штраф", "суд", "law", "legal", "қонун"]
      .some((w) => low.includes(w))
  ) return "LEGAL_HELP";

  if (
    ["билет", "поезд", "самолет", "маршрут", "адрес", "travel", "ticket", "йўл", "поездка"]
      .some((w) => low.includes(w))
  ) return "TRAVEL_HELP";

  return "GENERAL_CHAT";
}

export async function fetchConversationHistory(
  supabase: any,
  userId: string,
): Promise<Array<{ role: string; content: string }>> {
  try {
    const { data, error } = await supabase
      .from("assistant_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(15);
    if (error) {
      console.error("❌ History fetch error:", error.message);
      return [];
    }
    return (data || []).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));
  } catch (error) {
    console.error("❌ History fetch exception:", error);
    return [];
  }
}
