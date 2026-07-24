"use client";

import { getYandexMapsKey, getYandexGeocoderKey } from "@/lib/env";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  display_name: string;
}

export interface RouteResult {
  from: [number, number];
  to: [number, number];
  distance: number;
  duration: number;
}

class YandexMapsService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = getYandexGeocoderKey();
  }
  
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    if (!this.apiKey) {
      console.warn("[YandexMaps] API key not configured");
      return [];
    }
    
    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${this.apiKey}&geocode=${encodeURIComponent(query)}&format=json&results=5&lang=ru_RU`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      const features = data.response?.GeoObjectCollection?.featureMember || [];
      
      return features.map((feature: any) => {
        const geoObject = feature.GeoObject;
        const [lng, lat] = geoObject.Point.pos.split(' ').map(Number);
        
        return {
          latitude: lat,
          longitude: lng,
          address: geoObject.name,
          display_name: geoObject.description || geoObject.name
        };
      });
      
    } catch (error) {
      console.error("Geocoding error:", error);
      return [];
    }
  }
  
  async geocodeAddress(address: string): Promise<[number, number] | null> {
    const results = await this.searchAddress(address);
    if (results.length > 0) {
      return [results[0].longitude, results[0].latitude];
    }
    return null;
  }
  
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!this.apiKey) return "";
    
    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${this.apiKey}&geocode=${lng},${lat}&format=json&results=1&lang=ru_RU`;
      const response = await fetch(url);
      
      if (!response.ok) return "";
      
      const data = await response.json();
      const feature = data.response?.GeoObjectCollection?.featureMember?.[0];
      
      return feature?.GeoObject?.name || "";
      
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return "";
    }
  }
  
  async calculateRoute(from: [number, number], to: [number, number]): Promise<RouteResult | null> {
    return {
      from,
      to,
      distance: Math.sqrt(Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2)) * 111000,
      duration: 30
    };
  }
  
  openYandexMaps(coordinates: [number, number], address?: string) {
    const [lng, lat] = coordinates;
    const url = `https://yandex.ru/maps/?pt=${lng},${lat}&z=15`;
    window.open(url, '_blank');
  }
  
  openYandexRoute(from: [number, number], to: [number, number]) {
    const [fromLng, fromLat] = from;
    const [toLng, toLat] = to;
    const url = `https://yandex.ru/maps/?rtext=${fromLat},${fromLng}~${toLat},${toLng}&rtt=auto`;
    window.open(url, '_blank');
  }
}

export const mapsService = new YandexMapsService();