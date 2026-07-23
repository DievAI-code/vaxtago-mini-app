import { supabase } from "@/integrations/supabase/client";
import { Job, JobSearchParams } from "./types";

export const hhService = {
  async search(params: JobSearchParams): Promise<Job[]> {
    try {
      const { data, error } = await supabase.functions.invoke("jobs-search", {
        body: { action: "search", params }
      });

      if (error) throw error;
      if (data?.error === "API_NOT_CONNECTED") throw new Error("API_NOT_CONNECTED");

      const items = data.items || [];
      return items.map((item: any) => ({
        id: item.id,
        source: "hh",
        title: item.name,
        company: item.employer?.name || "Не указана",
        salary: this.formatSalary(item.salary),
        city: item.area?.name || "Россия",
        description: item.snippet?.responsibility || "",
        url: item.alternate_url,
        schedule: item.schedule?.name || "Полный день"
      }));
    } catch (err) {
      console.error("[HH Service] Error:", err);
      throw err;
    }
  },

  formatSalary(salary: any): string {
    if (!salary) return "Зарплата не указана";
    const cur = salary.currency === "RUR" ? "₽" : salary.currency;
    if (salary.from && salary.to) return `${salary.from} - ${salary.to} ${cur}`;
    if (salary.from) return `от ${salary.from} ${cur}`;
    if (salary.to) return `до ${salary.to} ${cur}`;
    return "Зарплата не указана";
  }
};