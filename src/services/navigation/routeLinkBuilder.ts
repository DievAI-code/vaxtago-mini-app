"use client";

export interface Coords {
  lat: number;
  lon: number;
}

export function createYandexRouteLink(from: Coords, to: Coords, mode: string = "auto"): string {
  // Yandex format: lat,lon
  return `https://yandex.ru/maps/?rtext=${from.lat},${from.lon}~${to.lat},${to.lon}&rtt=${mode}`;
}

export function create2GISRouteLink(from: Coords, to: Coords, mode: string = "car"): string {
  // 2GIS format: lon,lat
  return `https://2gis.ru/routeSearch/rsType/${mode}/from/${from.lon},${from.lat}/to/${to.lon},${to.lat}`;
}