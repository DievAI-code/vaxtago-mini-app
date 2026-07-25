"use client";

import { mapDebugStore } from "./mapDebugStore";

const DEBUG_KEY = "vaqta_maps_debug_enabled";

export const mapDebug = {
  isEnabled(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(DEBUG_KEY) === "true";
    } catch {
      return false;
    }
  },

  setEnabled(enabled: boolean) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(DEBUG_KEY, enabled ? "true" : "false");
    } catch {}
  },

  startQuery(query: string): string | null {
    if (!this.isEnabled()) return null;
    const entry = mapDebugStore.addLog(query);
    console.log(`\n[VAQTA MAP DEBUG]\n====================\nQUERY: ${query}\n--------------------`);
    return entry.id;
  },

  log(id: string | null, step: string, data: any) {
    if (!id || !this.isEnabled()) return;
    mapDebugStore.updateLog(id, { name: step, data });

    let logStr = `\n[${step.toUpperCase()}]`;
    if (typeof data === "object" && data !== null) {
      logStr += "\n" + JSON.stringify(data, null, 2);
    } else {
      logStr += `\n${data}`;
    }
    console.log(logStr);
  },

  error(id: string | null, error: string) {
    if (!id || !this.isEnabled()) return;
    mapDebugStore.setError(id, error);
    console.log(`\n[ERROR]\n${error}\n`);
  },

  endQuery(id: string | null) {
    if (!id || !this.isEnabled()) return;
    console.log(`\n[FINAL RESULT]\n====================\n`);
  },
};