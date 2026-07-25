"use client";

import { MapLocation } from "./types";
import { gis2Provider } from "./providers/gis2Provider";
import { yandexProvider } from "./providers/yandexProvider";

export const mapService = {
  async search(query: string, city?: string): Promise<MapLocation[]> {
    let results = await gis2Provider.search(query, city);
    if (results.length === 0) {
      results = await yandexProvider.search(query, city);
    }
    return results;
  },

  async searchSingle(query: string, city?: string): Promise<MapLocation | null> {
    const results = await this.search(query, city);
    return results[0] || null;
  }
};