"use client";

import { get2GISMapKey } from "@/lib/env";

export type SearchType = "organization" | "railway_station" | "address" | "category" | "general";

export interface SearchResult {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  score: number;
  source: "2gis" | "alias" | "dictionary";
}

const CITY_DICTIONARY: Record<string, string> = {
  "тюмень": "Тюмень",
  "москва": "Москва",
  "ташкент": "Ташкент",
  "нижневартовск": "Нижневартовск",
  "сургут": "Сургут",
};

/**
 * AI Dictionary / Aliases
 */
const ALIASES: Record<string, { title: string; category: string }> = {
  "епрс": { title: "Ермаковское предприятие по ремонту скважин", category: "organization" },
  "ермако": { title: "Ермаковское предприятие по ремонту скважин", category: "organization" },
  "жд": { title: "Железнодорожный вокзал", category: "railway_station" },
  "темир йул": { title: "Железнодорожный вокзал", category: "railway_station" },
};

export const searchEngine = {
  async executeSearch(input: string, userCenter?: [number, number]): Promise<SearchResult[]> {
    const apiKey = get2GISMapKey();
    const low = input.toLowerCase().trim();
    
    // 1. Check Local Aliases / Dictionary
    for (const [alias, data] of Object.entries(ALIASES)) {
      if (low.includes(alias)) {
        const query = low.replace(alias, data.title);
        const results = await this.fetch2GIS(query, apiKey);
        if (results.length > 0) return results.map(r => ({ ...r, score: r.score + 100 }));
      }
    }

    // 2. Direct 2GIS Search
    return await this.fetch2GIS(low, apiKey);
  },

  async fetch2GIS(query: string, key: string): Promise<SearchResult[]> {
    try {
      const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&key=${key}&fields=items.point,items.name,items.address_name&limit=10`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      const items = data.result?.items || [];
      
      return items.map((item: any) => ({
        id: item.id,
        title: item.name,
        address: item.address_name || item.full_name || "Адрес не указан",
        latitude: item.point?.lat,
        longitude: item.point?.lon,
        type: "general",
        score: 50,
        source: "2gis"
      })).filter((i: any) => i.latitude && i.longitude);
    } catch {
      return [];
    }
  }
};