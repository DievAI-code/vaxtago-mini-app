"use client";

import { supabase } from "@/integrations/supabase/client";
import { VaqtaJob } from "../jobsAggregator";

export const russiaWorkAdapter = {
  async fetchJobs(query: string): Promise<VaqtaJob[]> {
    try {
      const { data, error } = await supabase.functions.invoke("jobs-proxy", {
        body: { source: "trudvsem", query }
      });

      if (error || data?.error === "TRUDVSEM_NOT_CONFIGURED") {
        throw new Error("TRUDVSEM_NOT_CONNECTED");
      }

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
      console.warn("[Trudvsem Adapter] Source not connected or failed");
      throw err;
    }
  }
};