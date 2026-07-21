export interface Employer {
  id: string;
  name: string;
  rating?: number;
  reviews_count?: number;
  licenses_status?: string;
  blacklist_flag?: boolean;
  tax_debt_flag?: boolean;
  ai_risk_score?: string;
}

export interface Vacancy {
  id: string;
  title: string;
  city: string;
  salary_from?: number;
  salary_to?: number;
  description?: string;
  url: string;
  employer_id?: string;
  employers?: Employer;
  created_at: string;
}

export interface ScanHistory {
  id: string;
  user_id?: string;
  image_url: string;
  original_text: string;
  translated_text: string;
  language: string;
  created_at: string;
}