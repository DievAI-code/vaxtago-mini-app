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

export interface UserProfile {
  id: string;
  telegram_id: number | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  phone_number: string | null;
  language_code: string;
  subscription_status: string;
}

export interface AnalyticsEvent {
  id: string;
  event_name: string;
  user_id?: string;
  telegram_id?: number;
  page?: string;
  device?: string;
  browser?: string;
  created_at: string;
}