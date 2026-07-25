"use client";

export interface VoiceDebugEntry {
  timestamp: string;
  step: string;
  data: any;
}

class VoiceDebugger {
  private logs: VoiceDebugEntry[] = [];
  private enabled = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  log(step: string, data: any) {
    if (!this.enabled) return;
    const entry: VoiceDebugEntry = {
      timestamp: new Date().toISOString(),
      step,
      data,
    };
    this.logs.push(entry);
    if (this.logs.length > 50) this.logs.shift();
    console.log(`[VAQTA VOICE DEBUG] ${step}:`, data);
  }

  getLogs(): VoiceDebugEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }

  printPipeline() {
    console.log("\n[VAQTA VOICE DEBUG] === Full Pipeline ===");
    this.logs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log.step}:`, log.data);
    });
    console.log("[VAQTA VOICE DEBUG] === End Pipeline ===\n");
  }
}

export const voiceDebug = new VoiceDebugger();