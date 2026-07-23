"use client";

import { jobsAggregator as coreAggregator } from "./jobs/jobsAggregator";
import { Job, JobSearchParams } from "./jobs/types";

export type VaqtaJob = Job;

export const jobsAggregator = {
  async search(query: string, city?: string): Promise<Job[]> {
    const params: JobSearchParams = { text: query, area: city };
    const res = await coreAggregator.getJobs(params);
    return res.jobs || [];
  }
};