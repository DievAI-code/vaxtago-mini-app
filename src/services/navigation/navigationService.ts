"use client";

export type NavigationProvider = "yandex" | "2gis" | "browser";

export interface RouteOptions {
  from: string;
  to: string;
  mode?: "car" | "walking" | "transit";
}

export interface NavigationLink {
  provider: NavigationProvider;
  url: string;
  deepLink: string;
  label: string;
  icon: string;
}

const MODE_MAP: Record<string, { yandex: string; dgis: string; google: string }> = {
  car: { yandex: "auto", dgis: "car", google: "driving" },
  walking: { yandex: "pd", dgis: "foot", google: "walking" },
  transit: { yandex: "mt", dgis: "bus", google: "transit" },
};

function buildYandexUrl(from: string, to: string, mode: string): { url: string; deepLink: string } {
  const fromEncoded = encodeURIComponent(from);
  const toEncoded = encodeURIComponent(to);
  const modeKey = MODE_MAP[mode]?.yandex || "auto";

  const url = `https://yandex.ru/maps/?rtext=${fromEncoded}~${toEncoded}&rtt=${modeKey}`;
  const deepLink = `yandexmaps://maps.yandex.ru/?rtext=${fromEncoded}~${toEncoded}&rtt=${modeKey}`;

  return { url, deepLink };
}

function buildDgisUrl(from: string, to: string, mode: string): { url: string; deepLink: string } {
  const fromEncoded = encodeURIComponent(from);
  const toEncoded = encodeURIComponent(to);
  const modeKey = MODE_MAP[mode]?.dgis || "car";

  const url = `https://2gis.ru/directions?from=${fromEncoded}&to=${toEncoded}&type=${modeKey}&m=1`;
  const deepLink = `dgis://2gis.ru/directions?from=${fromEncoded}&to=${toEncoded}&type=${modeKey}&m=1`;

  return { url, deepLink };
}

function buildGoogleUrl(from: string, to: string, mode: string): { url: string; deepLink: string } {
  const fromEncoded = encodeURIComponent(from);
  const toEncoded = encodeURIComponent(to);
  const modeKey = MODE_MAP[mode]?.google || "driving";

  const url = `https://www.google.com/maps/dir/?api=1&origin=${fromEncoded}&destination=${toEncoded}&travelmode=${modeKey}`;
  // No reliable universal deep link for Google Maps on all platforms, use URL
  return { url, deepLink: url };
}

export const navigationService = {
  buildRoute(options: RouteOptions): NavigationLink[] {
    const { from, to, mode = "car" } = options;

    const yandex = buildYandexUrl(from, to, mode);
    const dgis = buildDgisUrl(from, to, mode);
    const google = buildGoogleUrl(from, to, mode);

    return [
      {
        provider: "yandex",
        url: yandex.url,
        deepLink: yandex.deepLink,
        label: "Яндекс Карты",
        icon: "🟡",
      },
      {
        provider: "2gis",
        url: dgis.url,
        deepLink: dgis.deepLink,
        label: "2ГИС",
        icon: "🟢",
      },
      {
        provider: "browser",
        url: google.url,
        deepLink: google.deepLink,
        label: "Браузер",
        icon: "🌐",
      },
    ];
  },

  openRoute(provider: NavigationProvider, options: RouteOptions): void {
    const links = this.buildRoute(options);
    const link = links.find((l) => l.provider === provider);
    if (!link) return;

    if (provider === "browser") {
      window.open(link.url, "_blank", "noopener,noreferrer");
      return;
    }

    // Try deep link first (opens native app if installed), then fall back to web URL
    const linkElement = document.createElement("a");
    linkElement.href = link.deepLink;
    linkElement.style.display = "none";
    document.body.appendChild(linkElement);

    const startTime = Date.now();

    const handleBlur = () => {
      const elapsed = Date.now() - startTime;
      // If app opened within 100ms, deep link worked
      if (elapsed < 100) {
        cleanup();
      }
    };

    const fallback = window.setTimeout(() => {
      // If still on page after 1500ms, deep link failed, open web URL
      window.open(link.url, "_blank", "noopener,noreferrer");
      cleanup();
    }, 1500);

    const cleanup = () => {
      window.clearTimeout(fallback);
      window.removeEventListener("blur", handleBlur);
      if (linkElement.parentNode) linkElement.parentNode.removeChild(linkElement);
    };

    linkElement.click();
    window.addEventListener("blur", handleBlur);
  },

  getNavigationLinks(options: RouteOptions): NavigationLink[] {
    return this.buildRoute(options);
  },

  openExternalMap(provider: NavigationProvider, query: string): void {
    if (provider === "yandex") {
      window.open(`https://yandex.ru/maps/?text=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
    } else if (provider === "2gis") {
      window.open(`https://2gis.ru/search?query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
    }
  },
};