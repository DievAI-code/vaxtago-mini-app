export interface HHVacancySalary {
  from: number | null;
  to: number | null;
  currency: string | null;
  gross: boolean | null;
}

export interface HHLogoUrls {
  "90"?: string;
  "240"?: string;
  original?: string;
}

export interface HHEmployer {
  id: string | null;
  name: string;
  url: string | null;
  alternate_url?: string;
  logo_urls?: HHLogoUrls | null;
  trusted?: boolean;
}

export interface HHArea {
  id: string;
  name: string;
  url?: string;
}

export interface HHAddress {
  city?: string;
  street?: string;
  building?: string;
  raw?: string;
  lat?: number;
  lng?: number;
}

export interface HHVacancySnippet {
  requirement: string | null;
  responsibility: string | null;
}

export interface HHIdName {
  id: string;
  name: string;
}

export interface HHVacancy {
  id: string;
  name: string;
  salary: HHVacancySalary | null;
  employer: HHEmployer;
  area: HHArea;
  address: HHAddress | null;
  alternate_url: string;
  snippet: HHVacancySnippet;
  schedule: HHIdName | null;
  experience: HHIdName | null;
  employment: HHIdName | null;
  published_at: string;
}

export interface HHSearchResponse {
  items: HHVacancy[];
  found: number;
  pages: number;
  page: number;
  per_page: number;
}

export interface HHSearchParams {
  text?: string;
  area?: string;
  professional_role?: string;
  experience?: string;
  employment?: string;
  schedule?: string;
  salary?: number;
  only_with_salary?: boolean;
  page?: number;
  per_page?: number;
}

export interface NormalizedVacancy {
  id: string;
  title: string;
  company: string;
  city: string;
  salary: string;
  employment: string;
  experience: string;
  description: string;
  url: string;
  address?: string;
  publishedAt: string;
}

export interface HHSearchResult {
  items: NormalizedVacancy[];
  found: number;
  pages: number;
  page: number;
  perPage: number;
}