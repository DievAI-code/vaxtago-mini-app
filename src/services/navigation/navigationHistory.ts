"use client";

export interface RouteHistoryEntry {
  id: string;
  from: string;
  to: string;
  city?: string;
  provider?: string;
  createdAt: string;
}

const STORAGE_KEY = "vaqta_navigation_history";
const MAX_ENTRIES = 20;

export const navigationHistory = {
  getAll(): RouteHistoryEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  add(entry: Omit<RouteHistoryEntry, "id" | "createdAt">): RouteHistoryEntry {
    const newEntry: RouteHistoryEntry = {
      ...entry,
      id: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
    };

    const existing = this.getAll();
    const updated = [newEntry, ...existing].slice(0, MAX_ENTRIES);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    return newEntry;
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  getRecent(limit: number = 5): RouteHistoryEntry[] {
    return this.getAll().slice(0, limit);
  },
};