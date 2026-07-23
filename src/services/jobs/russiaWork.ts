"use client";
import { VaqtaJob } from "./hh";

export const russiaWorkAdapter = {
  async fetchJobs(query: string): Promise<VaqtaJob[]> {
    try {
      const url = `https://opendata.trudvsem.ru/api/v1/vacancies/any?text=${encodeURIComponent(query)}&limit=10`;
      const response = await fetch(url);
      const data = await response.json();
      
      return (data.results?.vacancies || []).map((v: any) => {
        const item = v.vacancy;
        return {
          id: `trud_${item.id}`,
          source: 'trudvsem',
          title: item['job-name'],
          company: item.company.name,
          salary: `${item.salary || 'Не указана'}`,
          salary_min: parseInt(item.salary_min) || 0,
          city: item.region.name,
          description: item.requirement?.content || '',
          url: item.vac_url,
          schedule: item.schedule || 'Сменный график',
          housing: item.accommodation?.provided || false
        };
      });
    } catch (err) {
      console.error("[Trudvsem Adapter] Error:", err);
      return [];
    }
  }
};