"use client";

import { getYandexKey } from "./env";

let loadPromise: Promise<void> | null = null;

export function loadYandexMaps(): Promise<void> {
  const apiKey = getYandexKey();

  if (!apiKey) {
    return Promise.reject(new Error("Yandex Maps API key is missing"));
  }

  if (window.ymaps3) {
    return window.ymaps3.ready;
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    
    script.onload = () => {
      if (window.ymaps3) {
        window.ymaps3.ready.then(() => resolve()).catch(reject);
      } else {
        reject(new Error("ymaps3 failed to initialize"));
      }
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Yandex Maps script"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

// Fallback для случаев, когда API ключ недоступен
export const yandexMapsFallback = {
  searchAddress: async (query: string) => {
    console.warn("Yandex Maps unavailable, using fallback geocoding");
    
    // Простой fallback - возвращаем координаты Ташкента
    return [{
      lat: 41.2995,
      lng: 69.2401,
      address: query,
      name: query,
      city: "Ташкент"
    }];
  },
  
  createRoute: (lat: number, lng: number) => {
    const url = `https://yandex.ru/maps/?rtext=~${lat},${lng}&rtt=auto`;
    window.open(url, "_blank");
  }
};