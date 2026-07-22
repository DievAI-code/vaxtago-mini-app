export type Lang = "ru" | "uz" | "tg" | "ky" | "en";

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

// Payment Types
export interface LabeledPrice {
  label: string;
  amount: number;
}

export interface SuccessfulPayment {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  provider_payment_charge_id: string;
}

export interface PreCheckoutQuery {
  id: string;
  from: TelegramFrom;
  currency: string;
  total_amount: number;
  invoice_payload: string;
}