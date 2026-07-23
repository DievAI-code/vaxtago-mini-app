import { supabase } from "@/integrations/supabase/client";
import { Job, JobSearchParams } from "./types";
import { hhService } from "./hh";
import { russiaWorkService } from "./russiaWork";

export const jobsAggregator = {
  async getJobs(params: JobSearchParams): Promise<{ jobs: Job[]; error?: string }> {
    const query = params.text || "";
    
    try {
      // 1. Пытаемся взять из кэша (быстрый ответ)
      if (query) {
        const { data: cached } = await supabase
          .from("jobs_cache")
          .select("*")
          .ilike("title", `%${query}%`)
          .limit(10);
        
        if (cached && cached.length > 3) {
          return { jobs: cached as Job[] };
        }
      }

      // 2. Параллельный запрос к источникам
      // HH может вернуть ошибку API_NOT_CONNECTED, если нет ключей
      const [russiaWorkJobs, hhResult] = await Promise.allSettled([
        russiaWorkService.search(query),
        hhService.search(params)
      ]);

      let allJobs: Job[] = [];
      
      if (russiaWorkJobs.status === 'fulfilled') {
        allJobs = [...allJobs, ...russiaWorkJobs.value];
      }
      
      if (hhResult.status === 'fulfilled') {
        allJobs = [...allJobs, ...hhResult.value];
      }

      // 3. Фоновое кэширование новых результатов
      if (allJobs.length > 0) {
        const cacheEntries = allJobs.slice(0, 20).map(j => ({
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

      return { jobs: allJobs };
    } catch (err) {
      console.error("[Aggregator] Critical failure:", err);
      return { jobs: [], error: "AGGREGATOR_ERROR" };
    }
  }
};