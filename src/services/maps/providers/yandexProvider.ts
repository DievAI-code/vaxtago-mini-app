"use client";

import { MapLocation, MapProvider } from "../types";
import { geocodingService } from "@/services/geocodingService";

export const yandexProvider: MapProvider = {
  async search(query: string, city?: string): Promise<MapLocation[]> {
    const q = city ? `${query} ${city}` : query;
    const osmResults = await geocodingService.searchAddress(q);
    
    return osmResults.map((r): MapLocation => ({
      id: r.display_name, 
      name: r.name || r.display_name.split(",")[0],
      address: r.display_name,
      latitude: r.latitude,
      longitude: r.longitude,
      source: 'yandex'
    }));
  },

  async getCoordinates(query: string, city?: string): Promise<[number, number] | null> {
    const results = await this.search(query, city);
    if (results.length > 0) {
      return [results[0].latitude, results[0].longitude];
    }
    return null;
  },

  openExternalMap(query: string): void {
    window.open(`https://yandex.ru/maps/?text=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  },

  openExternalRoute(from: string, to: string, mode: 'car' | 'foot' | 'bus' = 'car'): void {
    const fromEncoded = encodeURIComponent(from);
    const toEncoded = encodeURIComponent(to);
    const rtt = mode === 'foot' ? 'pd' : mode === 'bus' ? 'mt' : 'auto';
    window.open(`https://yandex.ru/maps/?rtext=${fromEncoded}~${toEncoded}&rtt=${rtt}`, "_blank", "noopener,noreferrer");
  }
};