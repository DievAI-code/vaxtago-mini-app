"use client";

export interface YandexRouteOptions {
  from: string;
  to: string;
  mode?: "car" | "walking" | "transit";
}

const YANDEX_MODE_MAP: Record<string, string> = {
  car: "auto",
  walking: "pd",
  transit: "mt",
};

export const yandexMapsProvider = {
  buildRouteUrl(options: YandexRouteOptions): string {
    const { from, to, mode = "car" } = options;
    const fromEncoded = encodeURIComponent(from);
    const toEncoded = encodeURIComponent(to);
    const modeKey = YANDEX_MODE_MAP[mode] || "auto";
    return `https://yandex.ru/maps/?rtext=${fromEncoded}~${toEncoded}&rtt=${modeKey}`;
  },

  buildDeepLink(options: YandexRouteOptions): string {
    const { from, to, mode = "car" } = options;
    const fromEncoded = encodeURIComponent(from);
    const toEncoded = encodeURIComponent(to);
    const modeKey = YANDEX_MODE_MAP[mode] || "auto";
    return `yandexmaps://maps.yandex.ru/?rtext=${fromEncoded}~${toEncoded}&rtt=${modeKey}`;
  },

  buildSearchUrl(query: string): string {
    return `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`;
  },

  buildSearchDeepLink(query: string): string {
    return `yandexmaps://maps.yandex.ru/?text=${encodeURIComponent(query)}`;
  },

  openRoute(options: YandexRouteOptions): void {
    const url = this.buildRouteUrl(options);
    window.open(url, "_blank", "noopener,noreferrer");
  },

  openSearch(query: string): void {
    const url = this.buildSearchUrl(query);
    window.open(url, "_blank", "noopener,noreferrer");
  },
};