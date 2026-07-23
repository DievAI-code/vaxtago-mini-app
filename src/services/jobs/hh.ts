"use client";

export interface VaqtaJob {
  id: string;
  source: 'hh' | 'trudvsem';
  title: string;
  company: string;
  salary: string;
  salary_min: number;
  city: string;
  description: string;
  url: string;
  schedule: string;
  housing: boolean;
}

export const hhAdapter = {
  async fetchJobs(query: string, city?: string): Promise<VaqtaJob[]> {
    try {
      const params = new URLSearchParams({
        text: query,
        per_page: '10',
        order_by: 'relevance'
      });
      if (city) params.append('area', '1'); // Simplified: mapping city to area ID would be better

      const response = await fetch(`https://api.hh.ru/vacancies?${params.toString()}`, {
        headers: { 'User-Agent': 'VaqtaAI/1.0 (dievds@gmail.com)' }
      });
      
      const data = await response.json();
      return (data.items || []).map((item: any) => ({
        id: `hh_${item.id}`,
        source: 'hh',
        title: item.name,
        company: item.employer?.name || 'Не указано',
        salary: this.formatSalary(item.salary),
        salary_min: item.salary?.from || 0,
        city: item.area?.name || 'Россия',
        description: item.snippet?.responsibility || '',
        url: item.alternate_url,
        schedule: item.schedule?.name || 'Полный день',
        housing: item.description?.toLowerCase().includes('проживание') || false
      }));
    } catch (err) {
      console.error("[HH Adapter] Error:", err);
      return [];
    }
  },

  formatSalary(salary: any): string {
    if (!salary) return 'Зарплата не указана';
    const cur = salary.currency === 'RUR' ? '₽' : salary.currency;
    if (salary.from && salary.to) return `${salary.from} - ${salary.to} ${cur}`;
    if (salary.from) return `от ${salary.from} ${cur}`;
    return `до ${salary.to} ${cur}`;
  }
};