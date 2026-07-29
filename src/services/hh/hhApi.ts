import { supabase } from "@/integrations/supabase/client";
import type { HHSearchParams, HHSearchResponse, HHVacancy } from "./hhTypes";

interface EdgeFunctionResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface EdgeErrorPayload {
  error?: string;
  message?: string;
}

async function callJobsSearch<T>(
  action: string,
  params: Record<string, string | number | undefined>
): Promise<T> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const result = (await supabase.functions.invoke("jobs-search", {
    body: { action, params },
  })) as EdgeFunctionResult<T & EdgeErrorPayload>;

  if (result.error) {
    throw new Error(result.error.message || "EDGE_FUNCTION_ERROR");
  }

  const payload = result.data;
  if (payload && typeof payload === "object" && "error" in payload && payload.error) {
    throw new Error(String(payload.error));
  }

  return payload as T;
}

export const hhApi = {
  async searchVacancies(params: HHSearchParams): Promise<HHSearchResponse> {
    return callJobsSearch<HHSearchResponse>("search", {
      text: params.text,
      area: params.area,
      professional_role: params.professional_role,
      experience: params.experience,
      employment: params.employment,
      schedule: params.schedule,
      page: params.page ?? 0,
      per_page: params.per_page ?? 10,
    });
  },

  async getVacancy(id: string): Promise<HHVacancy> {
    return callJobsSearch<HHVacancy>("get_one", { id });
  },
};