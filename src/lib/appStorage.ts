"use client";

export interface MapState {
  center: [number, number];
  zoom: number;
  lastRoute?: {
    from: string;
    to: string;
    mode: string;
  };
  timestamp: number;
}

export interface AssistantSession {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
  language: string;
  updatedAt: number;
}

const STORAGE_KEYS = {
  MAP_STATE: "vaqta_map_state",
  LAST_ROUTE: "vaqta_last_route",
  ASSISTANT_SESSION: "vaqta_assistant_session",
};

export function saveMapState(state: Omit<MapState, "timestamp">): void {
  try {
    const data: MapState = { ...state, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEYS.MAP_STATE, JSON.stringify(data));
  } catch (error) {
    console.warn("[appStorage] Failed to save map state:", error);
  }
}

export function loadMapState(): MapState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAP_STATE);
    if (!raw) return null;
    const state: MapState = JSON.parse(raw);
    const isExpired = Date.now() - state.timestamp > 24 * 60 * 60 * 1000;
    if (isExpired) {
      localStorage.removeItem(STORAGE_KEYS.MAP_STATE);
      return null;
    }
    return state;
  } catch (error) {
    console.warn("[appStorage] Failed to get map state:", error);
    return null;
  }
}

export function clearMapState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.MAP_STATE);
  } catch (error) {
    console.warn("[appStorage] Failed to clear map state:", error);
  }
}

export function saveLastRoute(pathname: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_ROUTE, pathname);
  } catch (error) {
    console.warn("[appStorage] Failed to save last route:", error);
  }
}

export function loadLastRoute(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_ROUTE);
  } catch (error) {
    console.warn("[appStorage] Failed to load last route:", error);
    return null;
  }
}

export function clearLastRoute(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.LAST_ROUTE);
  } catch (error) {
    console.warn("[appStorage] Failed to clear last route:", error);
  }
}

export function saveAssistantSession(session: AssistantSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSISTANT_SESSION, JSON.stringify(session));
  } catch (error) {
    console.warn("[appStorage] Failed to save assistant session:", error);
  }
}

export function loadAssistantSession(): AssistantSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSISTANT_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("[appStorage] Failed to load assistant session:", error);
    return null;
  }
}

export function clearAssistantSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ASSISTANT_SESSION);
  } catch (error) {
    console.warn("[appStorage] Failed to clear assistant session:", error);
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[appStorage] Failed to save ${key}:`, error);
  }
}

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn(`[appStorage] Failed to get ${key}:`, error);
    return null;
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[appStorage] Failed to remove ${key}:`, error);
  }
}

export const appStorage = {
  saveMapState,
  loadMapState,
  clearMapState,
  saveLastRoute,
  loadLastRoute,
  clearLastRoute,
  saveAssistantSession,
  loadAssistantSession,
  clearAssistantSession,
  setItem,
  getItem,
  removeItem,
  clearState() {
    try {
      localStorage.removeItem(STORAGE_KEYS.MAP_STATE);
      localStorage.removeItem(STORAGE_KEYS.LAST_ROUTE);
      localStorage.removeItem(STORAGE_KEYS.ASSISTANT_SESSION);
    } catch (error) {
      console.warn("[appStorage] Failed to clear all state:", error);
    }
  },
};