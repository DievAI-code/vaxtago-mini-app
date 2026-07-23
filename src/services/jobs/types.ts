export interface Job {
  id: string;
  source: string;
  title: string;
  company: string;
  salary: string;
  city: string;
  description: string;
  url: string;
  schedule: string;
}

export interface JobSearchParams {
  text?: string;
  area?: string;
  salary?: number;
  schedule?: string;
  employment?: string;
  page?: number;
}