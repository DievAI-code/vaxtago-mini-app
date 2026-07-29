import { hhApi } from "./hhApi";
import type {
  HHSearchParams,
  HHSearchResult,
  HHVacancy,
  HHVacancySalary,
  NormalizedVacancy,
} from "./hhTypes";

export function formatSalary(salary: HHVacancySalary | null): string {
  if (!salary) return "";
  const cur =
    salary.currency === "RUR" || salary.currency === "RUB"
      ? "₽"
      : salary.currency || "₽";
  const fmt = (n: number) => n.toLocaleString("ru-RU");
  if (salary.from && salary.to) return `${fmt(salary.from)} – ${fmt(salary.to)} ${cur}`;
  if (salary.from) return `от ${fmt(salary.from)} ${cur}`;
  if (salary.to) return `до ${fmt(salary.to)} ${cur}`;
  return "";
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .trim();
}

export function normalizeVacancy(v: HHVacancy): NormalizedVacancy {
  return {
    id: v.id,
    title: v.name,
    company: v.employer?.name || "",
    city: v.area?.name || v.address?.city || "",
    salary: formatSalary(v.salary),
    employment: v.employment?.name || "",
    experience: v.experience?.name || "",
    description:
      stripHtml(v.snippet?.responsibility) || stripHtml(v.snippet?.requirement),
    url: v.alternate_url,
    address: v.address?.raw || v.address?.city,
    publishedAt: v.published_at,
  };
}

export const hhService = {
  async searchVacancies(params: HHSearchParams): Promise<HHSearchResult> {
    const res = await hhApi.searchVacancies(params);
    return {
      items: (res.items || []).map(normalizeVacancy),
      found: res.found ?? 0,
      pages: res.pages ?? 0,
      page: res.page ?? 0,
      perPage: res.per_page ?? 10,
    };
  },

  async getVacancy(id: string): Promise<NormalizedVacancy> {
    const v = await hhApi.getVacancy(id);
    return normalizeVacancy(v);
  },
};