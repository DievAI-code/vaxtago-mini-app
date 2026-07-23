"use client";

import { Job } from "./types";

export const russiaWorkService = {
  /**
   * Поиск вакансий через открытый API Работа России (Trudvsem)
   */
  async search(query: string, limit = 10): Promise<Job[]> {
    try {
      // Используем анонимный доступ к открытым данным
      const url = `https://opendata.trudvsem.ru/api/v1/vacancies/any?text=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Trudvsem API error: ${response.status}`);
      }
      
      const data = await response.json();
      const vacancies = data.results?.vacancies || [];
      
      return vacancies.map((v: any) => {
        const item = v.vacancy;
        return {
          id: item.id,
          source: "trudvsem",
          title: item['job-name'],
          company: item.company?.name || "Не указана",
          salary: item.salary || "Зарплата не указана",
          city: item.region?.name || "Россия",
          description: item.requirement?.content || "",
          url: item.vac_url,
          schedule: item.schedule || "Сменный график"
        };
      });
    } catch (error) {
      console.error("[RussiaWork Service] Error:", error);
      return [];
    }
  }
};