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
  console.log(`[VAQTA ROUTE] Input: "${text}"`);
  
  const intent = parseNavigationIntent(text);
  console.log(`[VAQTA ROUTE] Intent: ${intent.type}`, { 
    from: intent.from, 
    to: intent.to, 
    city: intent.city 
  });

  if (intent.type === "unknown") {
    console.log(`[VAQTA ROUTE] No navigation intent detected`);
    return null;
  }

  const dataSource = selectProviderForIntent(intent);
  const recommendedProvider = getPreferredNavigationProvider(intent);

  let fromPlace: ResolvedPlace | undefined;
  let toPlace: ResolvedPlace | undefined;
  let routeInfo: RouteInfo | null = null;

  if (intent.type === "route" && intent.to) {
    console.log(`[VAQTA ROUTE] Processing route: from="${intent.from || "current"}", to="${intent.to}", city="${intent.city || "none"}"`);

    if (intent.from) {
      console.log(`[VAQTA ROUTE] Searching FROM: "${intent.from}"`);
      fromPlace = await resolvePlace(intent.from, intent.city) || undefined;
      console.log(`[VAQTA ROUTE] Found FROM:`, fromPlace?.name || "NOT FOUND");
    }

    console.log(`[VAQTA ROUTE] Searching TO: "${intent.to}"`);
    toPlace = await resolvePlace(intent.to, intent.city) || undefined;
    console.log(`[VAQTA ROUTE] Found TO:`, toPlace?.name || "NOT FOUND");

    if (fromPlace && toPlace) {
      console.log(`[VAQTA ROUTE] Building route from "${fromPlace.name}" to "${toPlace.name}"`);
      routeInfo = await buildRouteInfo(fromPlace, toPlace, intent.mode || "car");
    }

    navigationHistory.add({
      from: intent.from || "Моё местоположение",
      to: intent.to,
      city: intent.city,
      provider: recommendedProvider,
    });
  } else if ((intent.type === "place_search" || intent.type === "nearby_search") && intent.query) {
    console.log(`[VAQTA ROUTE] Searching place: "${intent.query}"`);
    toPlace = await resolvePlace(intent.query, intent.city) || undefined;
    console.log(`[VAQTA ROUTE] Found place:`, toPlace?.name || "NOT FOUND");
  }

  let formattedDistance: string | undefined;
  let formattedDuration: string | undefined;

  if (routeInfo) {
    const formatted = formatRouteInfo(routeInfo);
    formattedDistance = formatted.distance;
    formattedDuration = formatted.duration;
    console.log(`[VAQTA ROUTE] Route built: ${formattedDistance}, ${formattedDuration}`);
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