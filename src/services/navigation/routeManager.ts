"use client";

import { ResolvedPlace } from "./placeResolver";

export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
  provider: string;
}

export interface RouteComparison {
  fromName: string;
  toName: string;
  distance: string;
  duration: string;
  recommended: string;
}

export async function buildRouteInfo(
  from: ResolvedPlace,
  to: ResolvedPlace,
  mode: "car" | "walking" | "transit" = "car"
): Promise<RouteInfo | null> {
  try {
    const profile = mode === "walking" ? "foot" : "car";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=false`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;

    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      provider: "osrm",
    };
  } catch {
    return null;
  }
}

export function formatRouteInfo(info: RouteInfo): { distance: string; duration: string } {
  const km = (info.distanceMeters / 1000).toFixed(1);
  const mins = Math.round(info.durationSeconds / 60);
  return {
    distance: `${km} км`,
    duration: `${mins} мин`,
  };
}

export function buildRouteComparison(
  fromName: string,
  toName: string,
  info: RouteInfo | null
): RouteComparison | null {
  if (!info) return null;

  const formatted = formatRouteInfo(info);

  return {
    fromName,
    toName,
    distance: formatted.distance,
    duration: formatted.duration,
    recommended: "OSRM",
  };
}