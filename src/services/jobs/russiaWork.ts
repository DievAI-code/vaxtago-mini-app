"use client";

import { Job } from "./types";

export interface SearchRussiaJobsOptions {
  query: string;
  city?: string;
  salaryFrom?: number;
  accommodation?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Вспомогательная функция для форматирования зарплаты из ответа Trudvsem API
 */
function formatTrudvsemSalary(salaryText?: string, min?: number, max?: number): string {
  if (min && max) {
    if (min === max) return `${min.toLocaleString("ru-RU")} ₽`;
    return `${min.toLocaleString("ru-RU")} – ${max.toLocaleString("ru-RU")} ₽`;
  }
  if (min) return `от ${min.toLocaleString("ru-RU")} ₽`;
  if (max) return `до ${max.toLocaleString("ru-RU")} ₽`;
  if (salaryText && salaryText.trim()) return salaryText;
  return "Зарплата по договоренности";
}

/**
 * Основная функция поиска вакансий через открытый API "Работа России"
 */
export async function searchRussiaJobs(
  queryOrOptions: string | SearchRussiaJobsOptions,
  cityArg?: string
): Promise<Job[]> {
  let query = "";
  let city = cityArg || "";
  let salaryFrom: number | undefined;
  let accommodation: boolean | undefined;
  let limit = 20;
  let offset = 0;

  if (typeof queryOrOptions === "string") {
    query = queryOrOptions;
  } else {
    query = queryOrOptions.query || "";
    city = queryOrOptions.city || "";
    salaryFrom = queryOrOptions.salaryFrom;
    accommodation = queryOrOptions.accommodation;
    limit = queryOrOptions.limit || 20;
    offset = queryOrOptions.offset || 0;
  }

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  try {
    const params = new URLSearchParams();
    params.append("text", trimmedQuery);
    params.append("limit", String(limit));
    params.append("offset", String(offset));

    if (city) {
      params.append("region", city);
    }

    // SSL Endpoint
    const url = `https://opendata.trudvsem.ru/api/v1/vacancies/any?${params.toString()}`;

    console.log(`[Trudvsem API] Requesting: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[Trudvsem API] HTTP error: ${response.status}`);
      throw new Error(`HTTP_${response.status}`);
    }

    const data = await response.json();
    const rawList: any[] = data.results?.vacancies || [];

    console.log(`[Trudvsem API] Найдено всего записей в ответе: ${rawList.length}`);

    const adaptedJobs: Job[] = [];

    for (const entry of rawList) {
      const v = entry.vacancy || entry;
      if (!v) continue;

      const title = v["job-name"] || v.title || "Вакансий без названия";
      const company = v.company?.name || "Работодатель не указан";
      const regionName = v.region?.name || v.addresses?.address?.[0]?.location || city || "Россия";
      const minSal = v.salary_min;
      const maxSal = v.salary_max;
      const salaryFormatted = formatTrudvsemSalary(v.salary, minSal, maxSal);
      const url = v.vac_url || "https://trudvsem.ru";
      const schedule = v.schedule || "График не указан";
      const accommodationInfo = v.accommodation || (v.work_places ? "Предоставляется" : undefined);

      // Фильтрация по минимальной зарплате если указана
      if (salaryFrom && minSal && minSal < salaryFrom) {
        continue;
      }

      const adapted: Job = {
        id: String(v.id || Math.random().toString(36).substring(2)),
        source: "trudvsem",
        title,
        company,
        salary: salaryFormatted,
        city: regionName,
        description: v.requirement?.content || v.duty || "Подробное описание вакансии доступно на официальном портале.",
        url,
        schedule,
        accommodation: accommodationInfo,
      };

      adaptedJobs.push(adapted);

      console.log(`• Вакансия: "${adapted.title}" | Компания: "${adapted.company}" | Регион: ${adapted.city} | ЗП: ${adapted.salary} | Ссылка: ${adapted.url}`);
    }

    return adaptedJobs;
  } catch (err: any) {
    console.error("[Trudvsem API] Error fetching jobs:", err?.message || err);
    throw new Error("TRUDVSEM_UNAVAILABLE");
  }
}

export const russiaWorkService = {
  search: searchRussiaJobs,
};