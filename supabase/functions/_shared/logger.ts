/// <reference path="../deno-env.d.ts" />

export interface LogEntry {
  user?: number | string;
  task?: string;
  model?: string;
  provider?: string;
  duration_ms?: number;
  success: boolean;
  error?: string;
}

export function logRequest(entry: LogEntry): void {
  const timestamp = new Date().toISOString();
  const logLine = {
    ts: timestamp,
    ...entry,
  };
  if (entry.success) {
    console.log(`✅ [AI] user=${entry.user ?? "-"} task=${entry.task ?? "-"} model=${entry.model ?? "-"} provider=${entry.provider ?? "-"} ${entry.duration_ms ?? 0}ms`);
  } else {
    console.error(`❌ [AI] user=${entry.user ?? "-"} task=${entry.task ?? "-"} model=${entry.model ?? "-"} provider=${entry.provider ?? "-"} ${entry.duration_ms ?? 0}ms err=${entry.error ?? "unknown"}`);
  }
  // Structured log for debugging
  console.log(JSON.stringify({ type: "ai_request", ...logLine }));
}