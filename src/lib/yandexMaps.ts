"use client";

const DEFAULT_API_KEY = "6a28f618-4ed1-466d-8d3e-85d74a320991";

let loadPromise: Promise<void> | null = null;

export function getYandexMapsKey(): string {
  return import.meta.env.VITE_YANDEX_MAPS_KEY || DEFAULT_API_KEY;
}

export function loadYandexMaps(): Promise<void> {
  const apiKey = getYandexMapsKey();

  if (!apiKey) {
    console.error("[YandexMaps] Key missing");
    return Promise.reject(new Error("Yandex key missing"));
  }

  if (window.ymaps3) {
    return window.ymaps3.ready;
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="api-maps.yandex.ru/v3"]'
    );

    if (existingScript) {
      if (window.ymaps3) {
        window.ymaps3.ready
          .then(() => resolve())
          .catch((err: any) =>
            reject(new Error(`Yandex Maps API init failed: ${err?.message || err}`))
          );
      } else {
        existingScript.addEventListener(
          "load",
          () => {
            if (window.ymaps3) {
              window.ymaps3.ready
                .then(() => resolve())
                .catch((err: any) =>
                  reject(new Error(`Yandex Maps API init failed: ${err?.message || err}`))
                );
            } else {
              reject(new Error("Yandex Maps script loaded but ymaps3 object missing"));
            }
          },
          { once: true }
        );
        existingScript.addEventListener(
          "error",
          () => {
            loadPromise = null;
            reject(new Error("Yandex Maps script loading failed"));
          },
          { once: true }
        );
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(
      apiKey
    )}&lang=ru_RU`;
    script.async = true;

    script.onload = () => {
      if (window.ymaps3) {
        window.ymaps3.ready
          .then(() => resolve())
          .catch((err: any) =>
            reject(new Error(`Yandex Maps API error: ${err?.message || err}`))
          );
      } else {
        reject(new Error("Yandex Maps script loaded but ymaps3 object missing"));
      }
    };

    script.onerror = () => {
      loadPromise = null;
      script.remove();
      reject(new Error("Yandex Maps script loading failed"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}