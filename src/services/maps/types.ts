"use client";

export interface MapLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  rating?: number;
  hours?: string;
  category?: string;
  source: '2gis' | 'yandex' | 'osm';
}

export interface MapProvider {
  search(query: string, city?: string): Promise<MapLocation[]>;
  getCoordinates(query: string, city?: string): Promise<[number, number] | null>;
  openExternalMap(query: string): void;
  openExternalRoute(from: string, to: string, mode?: 'car' | 'foot' | 'bus'): void;
}