"use client";

import { NavigationIntent, parseNavigationIntent } from "./intentParser";
import { ResolvedPlace, resolvePlace } from "./placeResolver";
import { RouteInfo, buildRouteInfo, formatRouteInfo } from "./routeManager";
import { selectProviderForIntent, getPreferredNavigationProvider } from "./providerSelector";
import { navigationHistory } from "./navigationHistory";
import { NavigationProvider } from "@/services/navigation";

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

export async function processNavigationQuery(
  text: string
): Promise<NavigationResult | null> {
  const intent = parseNavigationIntent(text);

  if (intent.type === "unknown") {
    return null;
  }

  const dataSource = selectProviderForIntent(intent);
  const recommendedProvider = getPreferredNavigationProvider(intent);

  let fromPlace: ResolvedPlace | undefined;
  let toPlace: ResolvedPlace | undefined;
  let routeInfo: RouteInfo | null = null;

  if (intent.type === "route" && intent.to) {
    if (intent.from) {
      fromPlace = await resolvePlace(intent.from, intent.city) || undefined;
    }

    toPlace = await resolvePlace(intent.to, intent.city) || undefined;

    if (fromPlace && toPlace) {
      routeInfo = await buildRouteInfo(fromPlace, toPlace, intent.mode || "car");
    }

    navigationHistory.add({
      from: intent.from || "Моё местоположение",
      to: intent.to,
      city: intent.city,
      provider: recommendedProvider,
    });
  } else if ((intent.type === "place_search" || intent.type === "nearby_search") && intent.query) {
    toPlace = await resolvePlace(intent.query, intent.city) || undefined;
  }

  let formattedDistance: string | undefined;
  let formattedDuration: string | undefined;

  if (routeInfo) {
    const formatted = formatRouteInfo(routeInfo);
    formattedDistance = formatted.distance;
    formattedDuration = formatted.duration;
  }

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