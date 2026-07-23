import { supabase } from "@/integrations/supabase/client";
import { Job, JobSearchParams } from "./types";
import { hhService } from "./hh";

export const jobsAggregator = {
  async getJobs(params: JobSearchParams): Promise<{ jobs: Job[]; error?: string }> {
    try {
      // 1. Сначала ищем в кэше для скорости (если поиск текстовый)
      if (params.text) {
        const { data: cached } = await supabase
          .from("jobs_cache")
          .select("*")
          .ilike("title", `%${params.text}%`)
          .limit(10);
        
        if (cached && cached.length > 5) {
          return { jobs: cached as Job[] };
        }
      }

      // 2. Если в кэше мало, идем в API
      const jobs = await hhService.search(params);

      // 3. Сохраняем результаты в кэш (фоном)
      if (jobs.length > 0) {
        const cacheEntries = jobs.map(j => ({
          source: j.source,
          external_id: j.id,
          title: j.title,
          company: j.company,
          salary: j.salary,
          city: j.city,
          description: j.description,
          url: j.url,
          schedule: j.schedule
        }));
        
        supabase.from("jobs_cache").upsert(cacheEntries, { onConflict: 'url' }).then();
      }

      return { jobs };
    } catch (err: any) {
      return { 
        jobs: [], 
        error: err.message === "API_NOT_CONNECTED" ? "API_NOT_CONNECTED" : "SERVER_ERROR" 
      };
    }
  }
};