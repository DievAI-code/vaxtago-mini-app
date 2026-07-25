"use client";

import { NavigationIntent, parseNavigationIntent } from "./intentParser";
import { ResolvedPlace, resolvePlace } from "./placeResolver";
import { RouteInfo, buildRouteInfo, formatRouteInfo } from "./routeManager";
import { selectProviderForIntent, getPreferredNavigationProvider } from "./providerSelector";
import { navigationHistory } from "./navigationHistory";
import { NavigationProvider } from "@/services/navigation";
import { mapDebug } from "@/services/maps/debug/mapDebug";

export interface NavigationResult {
  intent: NavigationIntent;
  fromPlace?: ResolvedPlace;
  toPlace?: ResolvedPlace;
  routeInfo?: RouteInfo | null;
  formattedDistance?: string;
  formattedDuration?: string;
  recommendedProvider: NavigationProvider;
  dataSource: string;
  query: string;
}

export async function processNavigationQuery(text: string): Promise<NavigationResult | null> {
  const debugId = mapDebug.startQuery(text);

  const intent = parseNavigationIntent(text);
  
  // Обязательный debug лог
  console.log("[NAV DEBUG]", {
    query: text,
    intent: intent.type,
    from_location: intent.from,
    to_location: intent.to,
    city: intent.city
  });

  mapDebug.log(debugId, "Intent Detection", intent);

  if (intent.type === "unknown") {
    mapDebug.log(debugId, "Result", "No navigation intent detected");
    mapDebug.endQuery(debugId);
    return null;
  }

  const dataSource = selectProviderForIntent(intent);
  const recommendedProvider = getPreferredNavigationProvider(intent);
  mapDebug.log(debugId, "Provider Selection", { dataSource, recommendedProvider });

  let fromPlace: ResolvedPlace | undefined;
  let toPlace: ResolvedPlace | undefined;
  let routeInfo: RouteInfo | null = null;

  if (intent.type === "route" && intent.to) {
    mapDebug.log(debugId, "Route Parser", {
      from: intent.from || "current_location",
      to: intent.to,
      city: intent.city || "none",
    });

    if (intent.from) {
      mapDebug.log(debugId, "POI Search (FROM)", { query: intent.from, city: intent.city });
      fromPlace = await resolvePlace(intent.from, intent.city) || undefined;
      mapDebug.log(debugId, "Resolved FROM", fromPlace ? `${fromPlace.name} (${fromPlace.latitude}, ${fromPlace.longitude})` : "Not Found");
    }

    mapDebug.log(debugId, "POI Search (TO)", { query: intent.to, city: intent.city });
    toPlace = await resolvePlace(intent.to, intent.city) || undefined;
    mapDebug.log(debugId, "Resolved TO", toPlace ? `${toPlace.name} (${toPlace.latitude}, ${toPlace.longitude})` : "Not Found");

    if (fromPlace && toPlace) {
      mapDebug.log(debugId, "Route API", `Building from ${fromPlace.name} to ${toPlace.name}`);
      routeInfo = await buildRouteInfo(fromPlace, toPlace, intent.mode || "car");
      if (routeInfo) {
        mapDebug.log(debugId, "Route API Result", {
          distance: `${(routeInfo.distanceMeters / 1000).toFixed(1)} km`,
          duration: `${Math.round(routeInfo.durationSeconds / 60)} min`,
        });
      } else {
        mapDebug.log(debugId, "Route API Result", "Failed or null");
      }
    } else {
      mapDebug.error(debugId, "Missing places for route");
    }

    navigationHistory.add({
      from: intent.from || "Моё местоположение",
      to: intent.to,
      city: intent.city,
      provider: recommendedProvider,
    });
  } else if ((intent.type === "place_search" || intent.type === "nearby_search") && intent.query) {
    mapDebug.log(debugId, "Place Search", { query: intent.query, city: intent.city });
    toPlace = await resolvePlace(intent.query, intent.city) || undefined;
    mapDebug.log(debugId, "Resolved Place", toPlace ? `${toPlace.name} (${toPlace.latitude}, ${toPlace.longitude})` : "Not Found");
  }

  let formattedDistance: string | undefined;
  let formattedDuration: string | undefined;

  if (routeInfo) {
    const formatted = formatRouteInfo(routeInfo);
    formattedDistance = formatted.distance;
    formattedDuration = formatted.duration;
  }

  mapDebug.endQuery(debugId);

  return {
    intent,
    fromPlace,
    toPlace,
    routeInfo,
    formattedDistance,
    formattedDuration,
    recommendedProvider,
    dataSource,
    query: text,
  };
}

export { parseNavigationIntent, type NavigationIntent };
export { resolvePlace, type ResolvedPlace };
export { navigationHistory, type RouteHistoryEntry };