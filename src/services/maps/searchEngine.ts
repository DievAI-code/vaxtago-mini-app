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
  source: "2gis";
}

const CITY_DICTIONARY: Record<string, string> = {
  "тюмень": "Тюмень",
  "москва": "Москва",
  "ташкент": "Ташкент",
  "нижневартовск": "Нижневартовск",
  "сургут": "Сургут",
  "тобольск": "Тобольск",
  "ишим": "Ишим",
};

export const searchEngine = {
  normalizeQuery(query: string): string {
    return query.toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/г\./g, "")
      .replace(/город/g, "")
      .trim();
  },

  detectSearchType(query: string): SearchType {
    const low = query.toLowerCase();
    if (/вокзал|жд|ж\/д|railway/i.test(low)) return "railway_station";
    if (/епрс|ермако|ооо|ао|завод|предприятие|цех|скважин|прс/i.test(low)) return "organization";
    if (/магазин|аптека|отель|гостиница|рынок|мфц|мвд|больница/i.test(low)) return "category";
    if (/\d/.test(low) && /ул|пр|квартал|дом/i.test(low)) return "address";
    return "general";
  },

  generate2GISQueries(query: string, type: SearchType): string[] {
    const norm = this.normalizeQuery(query);
    const variants: string[] = [norm];
    
    // Extract city if present
    let detectedCity = "";
    for (const [key, val] of Object.entries(CITY_DICTIONARY)) {
      if (norm.includes(key)) {
        detectedCity = val;
        break;
      }
    }

    if (type === "railway_station") {
      const citySuffix = detectedCity ? ` ${detectedCity}` : "";
      variants.push(`вокзал${citySuffix}`);
      variants.push(`железнодорожный вокзал${citySuffix}`);
      if (detectedCity) variants.push(`${detectedCity} вокзал`);
    }

    if (type === "organization") {
      if (norm.includes("епрс")) {
        const citySuffix = detectedCity ? ` ${detectedCity}` : "";
        variants.push(`Ермаковское ПРС${citySuffix}`);
        variants.push(`Ермаковское предприятие по ремонту скважин${citySuffix}`);
        variants.push(`ремонт скважин${citySuffix}`);
      }
    }

    return [...new Set(variants)];
  },

  rankResults(items: any[], query: string, type: SearchType, userCenter?: [number, number]): SearchResult[] {
    const lowQuery = query.toLowerCase();
    
    return items.map(item => {
      let score = 0;
      const title = (item.name || "").toLowerCase();
      const address = (item.address_name || item.full_name || "").toLowerCase();

      // 1. City Match (+50)
      for (const [key] of Object.entries(CITY_DICTIONARY)) {
        if (lowQuery.includes(key) && (title.includes(key) || address.includes(key))) {
          score += 50;
          break;
        }
      }

      // 2. Category Match (+30)
      if (type === "railway_station" && (title.includes("вокзал") || title.includes("станция"))) score += 30;
      if (type === "organization" && (item.rubrics || []).some((r: any) => r.name.toLowerCase().includes("предприятие") || r.name.toLowerCase().includes("сервис"))) score += 30;

      // 3. Name Match (+20)
      if (title.includes(lowQuery.split(' ')[0])) score += 20;

      // 4. Proximity (+10)
      if (userCenter && item.point) {
        const dist = Math.sqrt(Math.pow(item.point.lat - userCenter[0], 2) + Math.pow(item.point.lon - userCenter[1], 2));
        if (dist < 0.1) score += 10; // Within ~10km
      }

      return {
        id: item.id,
        title: item.name,
        address: item.address_name || item.full_name || "Адрес не указан",
        latitude: item.point?.lat,
        longitude: item.point?.lon,
        type: type,
        score,
        source: "2gis"
      };
    }).sort((a, b) => b.score - a.score);
  },

  async executeSearch(input: string, userCenter?: [number, number]): Promise<SearchResult[]> {
    const apiKey = get2GISMapKey();
    if (!apiKey) return [];

    const type = this.detectSearchType(input);
    const queries = this.generate2GISQueries(input, type);
    
    console.log(`[VAQTA SEARCH]`);
    console.log(`INPUT: ${input}`);
    console.log(`TYPE: ${type}`);
    console.log(`2GIS QUERIES:`, queries);

    let allItems: any[] = [];

    // Execute queries sequentially until we get good results
    for (const q of queries) {
      try {
        const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(q)}&key=${apiKey}&fields=items.point,items.name,items.address_name,items.rubrics&limit=10`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const items = data.result?.items || [];
          if (items.length > 0) {
            allItems = [...allItems, ...items];
            // If it's a very specific organization match, we can stop
            if (type === "organization" && items.length < 3) break;
          }
        }
      } catch (e) {
        console.error("2GIS Fetch Error", e);
      }
    }

    const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());
    const ranked = this.rankResults(uniqueItems, input, type, userCenter);

    console.log(`RESULTS: ${ranked.length}`);
    if (ranked.length > 0) console.log(`BEST RESULT:`, ranked[0].title);

    return ranked;
  }
};