import type { Vacancy } from "./types.ts";
import { formatSalary } from "./utils.ts";

export async function searchVacanciesStructured(query: string, city?: string): Promise<Vacancy[]> {
  try {
    const params = new URLSearchParams({ text: query, per_page: "5" });
    if (city) params.append("area", city);

    const response = await fetch(`https://api.hh.ru/vacancies?${params.toString()}`, {
      headers: { "User-Agent": "VaxtaGo/1.0 (telegram bot)" },
    });

    if (!response.ok) {
      console.error(`❌ HH API HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    const items: any[] = data.items || [];

    return items.slice(0, 5).map((item) => ({
      hhId: String(item.id),
      title: item.name || "Без названия",
      company: item.employer?.name || "Компания не указана",
      city: item.area?.name || "Город не указан",
      salary: formatSalary(item.salary),
      url: item.alternate_url || "https://hh.ru",
      schedule: item.schedule?.name || "Не указано",
      housing: "Предоставляется",
    }));
  } catch (error) {
    console.error("❌ HH API Error:", error);
    return [];
  }
}

export async function fetchVacancyFromHH(hhId: string): Promise<Vacancy | null> {
  try {
    const res = await fetch(`https://api.hh.ru/vacancies/${hhId}`, {
      headers: { "User-Agent": "VaxtaGo/1.0 (telegram bot)" },
    });
    if (!res.ok) return null;
    const item = await res.json();
    return {
      hhId,
      title: item.name || "Без названия",
      company: item.employer?.name || "Компания не указана",
      city: item.area?.name || "Город не указан",
      salary: formatSalary(item.salary),
      url: item.alternate_url || "https://hh.ru",
      schedule: item.schedule?.name || "Не указано",
    };
  } catch (error) {
    console.error("❌ HH fetch error:", error);
    return null;
  }
}
