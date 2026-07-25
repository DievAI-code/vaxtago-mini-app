"use client";

import { NavigationIntent } from "./intentParser";
import { NavigationProvider } from "@/services/navigation";

export type DataSource = "2gis" | "yandex" | "both";

export function selectProviderForIntent(intent: NavigationIntent): DataSource {
  switch (intent.type) {
    case "place_search": {
      const query = intent.query?.toLowerCase() || "";
      const isAddress = /ул\.|улица|дом|квартира|проспект|переулок|адрес/i.test(query);
      return isAddress ? "yandex" : "2gis";
    }

    case "nearby_search":
      return "2gis";

    case "route":
      return "both";

    case "navigation_open":
      return "yandex";

    default:
      return "yandex";
  }
}

export function getPreferredNavigationProvider(intent: NavigationIntent): NavigationProvider {
  if (intent.type === "nearby_search" || intent.type === "place_search") {
    const query = intent.query?.toLowerCase() || "";
    if (/работа|работодатель|вакансия|завод|склад|стройка/i.test(query)) {
      return "2gis";
    }
  }
  return "yandex";
}