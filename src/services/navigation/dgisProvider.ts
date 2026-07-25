"use client";

export interface DgisRouteOptions {
  from: string;
  to: string;
  mode?: "car" | "walking" | "transit";
}

const DGIS_MODE_MAP: Record<string, string> = {
  car: "car",
  walking: "foot",
  transit: "bus",
};

export const dgisProvider = {
  buildRouteUrl(options: DgisRouteOptions): string {
    const { from, to, mode = "car" } = options;
    const fromEncoded = encodeURIComponent(from);
    const toEncoded = encodeURIComponent(to);
    const modeKey = DGIS_MODE_MAP[mode] || "car";
    return `https://2gis.ru/directions?from=${fromEncoded}&to=${toEncoded}&type=${modeKey}&m=1`;
  },

  buildDeepLink(options: DgisRouteOptions): string {
    const { from, to, mode = "car" } = options;
    const fromEncoded = encodeURIComponent(from);
    const toEncoded = encodeURIComponent(to);
    const modeKey = DGIS_MODE_MAP[mode] || "car";
    return `dgis://2gis.ru/directions?from=${fromEncoded}&to=${toEncoded}&type=${modeKey}&m=1`;
  },

  buildSearchUrl(query: string): string {
    return `https://2gis.ru/search?query=${encodeURIComponent(query)}`;
  },

  buildSearchDeepLink(query: string): string {
    return `dgis://2gis.ru/search?query=${encodeURIComponent(query)}`;
  },

  openRoute(options: DgisRouteOptions): void {
    const url = this.buildRouteUrl(options);
    window.open(url, "_blank", "noopener,noreferrer");
  },

  openSearch(query: string): void {
    const url = this.buildSearchUrl(query);
    window.open(url, "_blank", "noopener,noreferrer");
  },
};