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
  /** Объекты, которые не удалось найти на карте (чтобы UI показал какой именно) */
  notFound?: { from?: string; to?: string };
}

export async function processNavigationQuery(text: string): Promise<NavigationResult | null> {
  const debugId = mapDebug.startQuery(text);

  // 1. ОБЯЗАТЕЛЬНО: сначала Route Parser → FROM / TO / CITY
  const intent = parseNavigationIntent(text);

  console.log("\n[NAVIGATION DEBUG]");
  console.log("Original Query:", text);
  console.log("Intent:", intent.type);
  console.log("FROM:", intent.from || "—");
  console.log("TO:", intent.to || "—");
  console.log("CITY:", intent.city || "—");

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
  const notFound: { from?: string; to?: string } = {};

  if (intent.type === "route" && intent.to) {
    // 2. ДВА ОТДЕЛЬНЫХ поисковых запроса: "FROM + CITY" и "TO + CITY"
    if (intent.from) {
      fromPlace = (await resolvePlace(intent.from, intent.city)) || undefined;
      if (!fromPlace) notFound.from = intent.from;
    }

    toPlace = (await resolvePlace(intent.to, intent.city)) || undefined;
    if (!toPlace) notFound.to = intent.to;

    console.log("Normalized FROM:", intent.from || "—");
    console.log("Normalized TO:", intent.to);
    console.log("2GIS/Yandex Result FROM:", fromPlace ? `${fromPlace.name} [${fromPlace.source}]` : "NOT FOUND");
    console.log("2GIS/Yandex Result TO:", toPlace ? `${toPlace.name} [${toPlace.source}]` : "NOT FOUND");
    console.log("Coordinates FROM:", fromPlace ? `${fromPlace.latitude}, ${fromPlace.longitude}` : "—");
    console.log("Coordinates TO:", toPlace ? `${toPlace.latitude}, ${toPlace.longitude}` : "—");

    mapDebug.log(debugId, "Resolved FROM", fromPlace ? `${fromPlace.name} (${fromPlace.latitude}, ${fromPlace.longitude})` : "Not Found");
    mapDebug.log(debugId, "Resolved TO", toPlace ? `${toPlace.name} (${toPlace.latitude}, ${toPlace.longitude})` : "Not Found");

    // 3. Маршрут строится ТОЛЬКО когда оба объекта найдены
    if (fromPlace && toPlace) {
      routeInfo = await buildRouteInfo(fromPlace, toPlace, intent.mode || "car");
      if (routeInfo) {
        mapDebug.log(debugId, "Route API Result", {
          distance: `${(routeInfo.distanceMeters / 1000).toFixed(1)} km`,
          duration: `${Math.round(routeInfo.durationSeconds / 60)} min`,
        });
      }
    }

    navigationHistory.add({
      from: intent.from || "Моё местоположение",
      to: intent.to,
      city: intent.city,
      provider: recommendedProvider,
    });
  } else if ((intent.type === "place_search" || intent.type === "nearby_search") && intent.query) {
    toPlace = (await resolvePlace(intent.query, intent.city)) || undefined;
    if (!toPlace) notFound.to = intent.query;
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

  const hasNotFound = Boolean(notFound.from || notFound.to);

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
    ...(hasNotFound ? { notFound } : {}),
  };
}

export { parseNavigationIntent, type NavigationIntent };
export { resolvePlace, type ResolvedPlace };
export { navigationHistory };