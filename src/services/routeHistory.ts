"use client";

export interface RouteRecord {
  id: string;
  from: string;
  to: string;
  fromCoords?: [number, number];
  toCoords?: [number, number];
  distance?: string;
  duration?: string;
  mode: string;
  createdAt: string;
}

const STORAGE_KEY = "vaqta_route_history";
const MAX_HISTORY = 50;

export const routeHistory = {
  getAll(): RouteRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  add(record: Omit<RouteRecord, "id" | "createdAt">): RouteRecord {
    const entry: RouteRecord = {
      ...record,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
    };

    const existing = this.getAll();
    const updated = [entry, ...existing].slice(0, MAX_HISTORY);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    return entry;
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  getRecent(limit: number = 5): RouteRecord[] {
    return this.getAll().slice(0, limit);
  },
};