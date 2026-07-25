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

const STORAGE_KEYS = {
  MAP_STATE: "vaqta_map_state",
  ROUTE_HISTORY: "vaqta_route_history"
};

export const appStorage = {
  // Map state
  saveMapState(state: Omit<MapState, "timestamp">): void {
    try {
      const data: MapState = {
        ...state,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEYS.MAP_STATE, JSON.stringify(data));
    } catch (error) {
      console.warn("[appStorage] Failed to save map state:", error);
    }
  },

  getMapState(): MapState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MAP_STATE);
      if (!raw) return null;
      
      const state: MapState = JSON.parse(raw);
      
      // Check if state is not older than 24 hours
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
  },

  clearMapState(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.MAP_STATE);
    } catch (error) {
      console.warn("[appStorage] Failed to clear map state:", error);
    }
  },

  // Generic methods
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[appStorage] Failed to save ${key}:`, error);
    }
  },

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn(`[appStorage] Failed to get ${key}:`, error);
      return null;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[appStorage] Failed to remove ${key}:`, error);
    }
  }
};