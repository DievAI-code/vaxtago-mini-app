"use client";

import { supabase } from "@/integrations/supabase/client";

export type ApiStatus = "pending" | "connected" | "error";

export interface JobsApiStatus {
  hh: ApiStatus;
  trudvsem: ApiStatus;
}

export const jobsApiStatus = {
  async check(): Promise<JobsApiStatus> {
    try {
      const { data, error } = await supabase.functions.invoke("jobs-proxy", {
        body: { action: "check_status" }
      });
      
      if (error || !data) {
        return { hh: "pending", trudvsem: "pending" };
      }

      return {
        hh: data.hh ? "connected" : "pending",
        trudvsem: data.trudvsem ? "connected" : "pending"
      };
    } catch {
      return { hh: "pending", trudvsem: "pending" };
    }
  },

  isAnyConnected(status: JobsApiStatus): boolean {
    return status.hh === "connected" || status.trudvsem === "connected";
  }
};