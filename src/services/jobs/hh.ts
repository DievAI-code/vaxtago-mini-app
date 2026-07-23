"use client";

import { supabase } from "@/integrations/supabase/client";
import { VaqtaJob } from "../jobsAggregator";

export const hhAdapter = {
  async fetchJobs(query: string): Promise<VaqtaJob[]> {
    try {
      const { data, error } = await supabase.functions.invoke("jobs-proxy", {
        body: { source: "hh", query }
      });

      if (error || data?.error === "HH_NOT_CONFIGURED") {
        throw new Error("HH_NOT_CONNECTED");
      }

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
      console.warn("[HH Adapter] Source not connected or failed");
      throw err;
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