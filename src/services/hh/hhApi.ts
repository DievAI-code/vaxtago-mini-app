import { supabase } from "@/integrations/supabase/client";
import { getValidAccessToken, logoutHH } from "./hhAuth";
import type { HHSearchParams, HHSearchResponse, HHVacancy } from "./hhTypes";

const HH_API_BASE = "https://api.hh.ru";

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

async function callHHApiDirect<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error("HH_AUTH_REQUIRED");
  }

  const url = new URL(`${HH_API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.append(key, String(value));
  });

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "VAQTA-AI/3.0 (contact: support@vaqta-ai.app)",
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    logoutHH();
    throw new Error("HH_TOKEN_EXPIRED");
  }
  if (res.status === 403) {
    throw new Error("HH_ACCESS_DENIED");
  }
  if (!res.ok) {
    throw new Error(`HH_API_ERROR_${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const hhApi = {
  async searchVacancies(params: HHSearchParams): Promise<HHSearchResponse> {
    // Пробуем прямой вызов HH API (если пользователь авторизован через OAuth)
    try {
      return await callHHApiDirect<HHSearchResponse>("/vacancies", {
        text: params.text,
        area: params.area,
        professional_role: params.professional_role,
        experience: params.experience,
        employment: params.employment,
        schedule: params.schedule,
        salary: params.salary,
        only_with_salary: params.only_with_salary ? "true" : undefined,
        page: params.page ?? 0,
        per_page: params.per_page ?? 10,
      });
    } catch (directError) {
      const msg = directError instanceof Error ? directError.message : "";
      // Если OAuth не требуется/проблемы с токеном — fallback на серверный прокси
      if (msg === "HH_AUTH_REQUIRED" || msg === "HH_TOKEN_EXPIRED") {
        throw directError;
      }
      console.warn("[HH] Direct API failed, falling back to proxy:", msg);
    }

    // Fallback: серверный прокси (для неавторизованных)
    return callJobsSearch<HHSearchResponse>("search", {
      text: params.text,
      area: params.area,
      professional_role: params.professional_role,
      experience: params.experience,
      employment: params.employment,
      schedule: params.schedule,
      salary: params.salary,
      only_with_salary: params.only_with_salary ? "true" : undefined,
      page: params.page ?? 0,
      per_page: params.per_page ?? 10,
    });
  },

  async getVacancy(id: string): Promise<HHVacancy> {
    return callJobsSearch<HHVacancy>("get_one", { id });
  },
};