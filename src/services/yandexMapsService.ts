"use client";

import { getYandexKey } from "@/lib/env";

export interface GeoPoint {
  lat: number;
  lng: number;
  address: string;
}

export const yandexMapsService = {
  async searchAddress(query: string): Promise<GeoPoint[]> {
    const key = getYandexKey();
    if (!key) throw new Error("MISSING_API_KEY");

    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${key}&geocode=${encodeURIComponent(query)}&format=json&lang=ru_RU`;
      const resp = await fetch(url);
      
      if (resp.status === 403) {
        console.error("Yandex Geocoder: Access Forbidden (403). Check if Geocoder is enabled for this API Key.");
        throw new Error("GEOCODER_ACCESS_DENIED");
      }

      const data = await resp.json();
      const collection = data.response.GeoObjectCollection.featureMember;

      return collection.map((item: any) => {
        const obj = item.GeoObject;
        const [lng, lat] = obj.Point.pos.split(" ").map(Number);
        return {
          lat,
          lng,
          address: obj.metaDataProperty.GeocoderMetaData.text
        };
      });
    } catch (err: any) {
      console.error("[YandexMaps] Error:", err.message);
      throw err;
    }
  },

  buildRoute(lat: number, lng: number) {
    const url = `https://yandex.ru/maps/?rtext=~${lat},${lng}&rtt=auto`;
    window.open(url, "_blank");
  }
};