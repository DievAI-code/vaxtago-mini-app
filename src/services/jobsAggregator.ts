"use client";
import { supabase } from "@/integrations/supabase/client";
import { VaqtaJob, hhAdapter } from "./jobs/hh";
import { russiaWorkAdapter } from "./jobs/russiaWork";

export const jobsAggregator = {
  async search(query: string, city?: string): Promise<VaqtaJob[]> {
    // 1. Попытка получить из кэша
    const { data: cached } = await supabase
      .from("jobs_cache")
      .select("*")
      .ilike("title", `%${query}%`)
      .limit(15);

    if (cached && cached.length > 5) {
      return cached.map(j => ({
        ...j,
        id: j.external_id,
        source: j.source as any,
        housing: j.housing
      }));
    }

    // 2. Если в кэше мало, идем в API
    const [hhResults, trudResults] = await Promise.all([
      hhAdapter.fetchJobs(query, city),
      russiaWorkAdapter.fetchJobs(query)
    ]);

    const combined = [...hhResults, ...trudResults];

    // 3. Фоновое кэширование
    if (combined.length > 0) {
      const cacheEntries = combined.map(j => ({
        source: j.source,
        external_id: j.id,
        title: j.title,
        company: j.company,
        salary: j.salary,
        salary_min: j.salary_min,
        city: j.city,
        description: j.description,
        url: j.url,
        schedule: j.schedule,
        housing: j.housing
      }));
      
      supabase.from("jobs_cache").upsert(cacheEntries, { onConflict: 'url' }).then();
    }

    return combined;
  }
};