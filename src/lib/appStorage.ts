"use client";

export interface MapState {
  lat: number;
  lon: number;
  zoom: number;
  address?: string;
  updatedAt: number;
}

export interface AssistantSession {
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
  language: string;
  updatedAt: number;
}

export interface ScannerState {
  language: string;
  targetLang: string;
  mode: string;
}

export const STORAGE_KEYS = {
  MAP_STATE: "vaqta_map_state",
  ASSISTANT_SESSION: "assistant_session",
  SCANNER_STATE: "vaqta_scanner_state",
  LAST_ROUTE: "last_route",
  USER_LANG: "vaqta_language",
  THEME: "vaxtago_theme",
};

export const appStorage = {
  saveState<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[appStorage] Failed to save key "${key}":`, e);
    }
  },

  loadState<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (e) {
      console.warn(`[appStorage] Failed to load key "${key}":`, e);
      return defaultValue;
    }
  },

  clearState(key?: string): void {
    try {
      if (key) {
        localStorage.removeItem(key);
      } else {
        localStorage.clear();
      }
    } catch (e) {
      console.warn(`[appStorage] Failed to clear storage:`, e);
    }
  },

  // Helpers
  saveMapState(state: MapState): void {
    this.saveState(STORAGE_KEYS.MAP_STATE, state);
  },

  loadMapState(): MapState | null {
    return this.loadState<MapState | null>(STORAGE_KEYS.MAP_STATE, null);
  },

  saveAssistantSession(session: AssistantSession): void {
    this.saveState(STORAGE_KEYS.ASSISTANT_SESSION, session);
  },

  loadAssistantSession(): AssistantSession | null {
    return this.loadState<AssistantSession | null>(STORAGE_KEYS.ASSISTANT_SESSION, null);
  },

  saveLastRoute(route: string): void {
    if (route && !route.includes("/login") && !route.includes("/admin/login")) {
      this.saveState(STORAGE_KEYS.LAST_ROUTE, route);
    }
  },

  loadLastRoute(): string {
    return this.loadState<string>(STORAGE_KEYS.LAST_ROUTE, "/home");
  },
};