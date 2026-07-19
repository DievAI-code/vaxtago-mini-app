export type Lang = "ru" | "uz";

export interface TelegramFrom {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

export interface Vacancy {
  hhId: string;
  title: string;
  company: string;
  city: string;
  salary: string;
  url: string;
  schedule?: string;
  housing?: string;
}
