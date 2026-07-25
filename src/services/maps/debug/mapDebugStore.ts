"use client";

export interface DebugStep {
  name: string;
  data: any;
}

export interface DebugLogEntry {
  id: string;
  timestamp: string;
  query: string;
  steps: DebugStep[];
  error?: string;
}

const MAX_LOGS = 50;
let logs: DebugLogEntry[] = [];

export const mapDebugStore = {
  addLog(query: string): DebugLogEntry {
    const entry: DebugLogEntry = {
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      query,
      steps: [],
    };
    logs.unshift(entry);
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(0, MAX_LOGS);
    }
    return entry;
  },

  updateLog(id: string, step: DebugStep) {
    const log = logs.find((l) => l.id === id);
    if (log) {
      log.steps.push(step);
    }
  },

  setError(id: string, error: string) {
    const log = logs.find((l) => l.id === id);
    if (log) {
      log.error = error;
    }
  },

  getLogs(): DebugLogEntry[] {
    return logs;
  },

  getLatestLog(): DebugLogEntry | null {
    return logs[0] || null;
  },

  clearLogs() {
    logs = [];
  },
};