export interface UserProfile {
  id: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  avatar_url?: string;
  country?: string;
  city?: string;
  role: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
}