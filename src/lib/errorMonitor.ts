"use client";

interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  context: string;
  timestamp: string;
  url: string;
}

const MAX_ERRORS = 20;

export const errorMonitor = {
  logs: [] as ErrorLog[],

  init() {
    if (typeof window === "undefined") return;

    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      const msg = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
      this.log(msg, "console.error");
    };

    window.addEventListener("error", (e) => {
      this.log(e.message, "window.onerror", e.error?.stack);
    });

    window.addEventListener("unhandledrejection", (e) => {
      this.log(String(e.reason), "unhandledrejection");
    });
  },

  log(message: string, context: string = "general", stack?: string) {
    const entry: ErrorLog = {
      id: Math.random().toString(36).slice(2),
      message: message.slice(0, 500),
      context,
      stack: stack?.slice(0, 1000),
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    this.logs.push(entry);
    if (this.logs.length > MAX_ERRORS) this.logs.shift();

    try {
      localStorage.setItem("vaqta_error_logs", JSON.stringify(this.logs));
    } catch {}
  },

  getLogs(): ErrorLog[] {
    return [...this.logs];
  },

  clear() {
    this.logs = [];
    try {
      localStorage.removeItem("vaqta_error_logs");
    } catch {}
  },
};