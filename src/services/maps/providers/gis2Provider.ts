"use client";

import { get2GISMapKey } from "@/lib/env";
import { MapLocation, MapProvider } from "../types";

export const gis2Provider: MapProvider = {
  async search(query: string, city?: string): Promise<MapLocation[]> {
    const key = get2GISMapKey();
    if (!key) return [];
    
    try {
      const searchQuery = city ? `${query} ${city}` : query;
      const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(searchQuery)}&key=${key}&fields=items.point,items.name,items.full_name,items.address_name,items.contact_groups,items.schedule,items.rating,items.rubrics&limit=5`;
      
      const res = await fetch(url);
      if (!res.ok) return [];
      
      const data = await res.json();
      const items = data.result?.items || [];
      
      return items.map((item: any): MapLocation => {
        let phone = "";
        let hours = "";
        
        if (item.contact_groups) {
          const phoneGroup = item.contact_groups.find((g: any) => g.type === "phone");
          if (phoneGroup?.contacts?.[0]?.value) {
            phone = phoneGroup.contacts[0].value;
          }
        }
        
        if (item.schedule) {
          hours = typeof item.schedule === 'string' ? item.schedule : "График работы доступен в 2ГИС";
        }
        
        return {
          id: item.id,
          name: item.name || item.full_name || "Объект",
          address: item.address_name || "",
          latitude: item.point?.lat || 0,
          longitude: item.point?.lon || 0,
          phone,
          rating: item.rating,
          hours,
          category: item.rubrics?.[0]?.name,
          source: '2gis'
        };
      }).filter((loc: MapLocation) => loc.latitude !== 0 && loc.longitude !== 0);
    } catch (e) {
      console.error("[2GIS] Search error:", e);
      return [];
    }
  },

  async getCoordinates(query: string, city?: string): Promise<[number, number] | null> {
    const results = await this.search(query, city);
    if (results.length > 0) {
      return [results[0].latitude, results[0].longitude];
    }
    return null;
  },

  openExternalMap(query: string): void {
    window.open(`https://2gis.ru/search?query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  },

  openExternalRoute(from: string, to: string, mode: 'car' | 'foot' | 'bus' = 'car'): void {
    const fromEncoded = encodeURIComponent(from);
    const toEncoded = encodeURIComponent(to);
    const type = mode === 'foot' ? 'foot' : mode === 'bus' ? 'bus' : 'car';
    window.open(`https://2gis.ru/directions?from=${fromEncoded}&to=${toEncoded}&type=${type}&m=1`, "_blank", "noopener,noreferrer");
  }
};