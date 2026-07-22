"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";

export interface VacancyMarkerData {
  id: string;
  title: string;
  salary: string;
  city: string;
  address: string;
  coordinates: [number, number]; // [longitude, latitude] in Yandex Maps v3
  type: "employer" | "verified" | "premium";
  employerName: string;
  schedule?: string;
  url?: string;
}

interface YandexMapProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  markers?: VacancyMarkerData[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: VacancyMarkerData) => void;
  userLocation?: [number, number] | null;
  className?: string;
}

const DEFAULT_API_KEY = "6a28f618-4ed1-466d-8d3e-85d74a320991";
let loadPromise: Promise<void> | null = null;

export function loadYandexMapsScript(): Promise<void> {
  const envKey = import.meta.env.VITE_YANDEX_MAPS_KEY;

  if (!envKey) {
    console.error("Yandex Maps API key is missing. Add VITE_YANDEX_MAPS_KEY to .env");
  }

  const apiKey = envKey || DEFAULT_API_KEY;

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.ymaps3) {
      window.ymaps3.ready.then(() => resolve()).catch(reject);
      return;
    }

    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru/v3"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.ymaps3) {
          window.ymaps3.ready.then(() => resolve()).catch(reject);
        } else {
          reject(new Error("ymaps3 object not found on window"));
        }
      });
      existingScript.addEventListener("error", (err) => reject(err));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async = true;

    script.onload = () => {
      if (window.ymaps3) {
        window.ymaps3.ready.then(() => resolve()).catch(reject);
      } else {
        reject(new Error("ymaps3 object not found on window"));
      }
    };

    script.onerror = (err) => {
      console.error("Failed to load Yandex Maps API v3 script:", err);
      loadPromise = null; // Позволить повторную попытку в случае ошибки сети
      reject(err);
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export function YandexMap({
  center = [69.2401, 41.2995], // Ташкент [lng, lat]
  zoom = 12,
  markers = [],
  selectedMarkerId,
  onSelectMarker,
  userLocation,
  className = "w-full h-full min-h-[350px] rounded-[2rem]",
}: YandexMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    loadYandexMapsScript()
      .then(() => {
        if (!mounted || !mapContainerRef.current) return;

        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = window.ymaps3;

        // Cleanup previous instance if any
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.destroy();
          } catch {}
          mapInstanceRef.current = null;
        }

        const map = new YMap(mapContainerRef.current, {
          location: {
            center,
            zoom,
          },
        });

        map.addChild(new YMapDefaultSchemeLayer({}));
        map.addChild(new YMapDefaultFeaturesLayer({}));

        mapInstanceRef.current = map;
        setLoading(false);
      })
      .catch((err) => {
        if (mounted) {
          console.error("[YandexMap] Initialization error:", err);
          setError("Не удалось загрузить Яндекс Карты. Проверьте API ключ.");
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map camera location on prop change
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setLocation({
        center,
        zoom,
        duration: 300,
      });
    }
  }, [center[0], center[1], zoom]);

  // Render & sync custom markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.ymaps3) return;

    const { YMapMarker } = window.ymaps3;
    const map = mapInstanceRef.current;

    const markerElements: any[] = [];

    // Render vacancy markers
    markers.forEach((m) => {
      const isSelected = selectedMarkerId === m.id;
      const el = document.createElement("div");
      el.className = "cursor-pointer transition-transform transform hover:scale-110 active:scale-95";

      let badgeBg = "bg-red-500 text-white border-red-400";
      let icon = "🔴";
      if (m.type === "verified") {
        badgeBg = "bg-[#00A86B] text-white border-[#00D4A8]";
        icon = "🟢";
      } else if (m.type === "premium") {
        badgeBg = "bg-[#D4AF37] text-black border-yellow-300 font-bold";
        icon = "⭐";
      }

      el.innerHTML = `
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-2xl border ${badgeBg} ${
          isSelected ? "ring-4 ring-white scale-110 z-50" : ""
        }">
          <span class="text-xs">${icon}</span>
          <span class="text-[11px] font-black tracking-tight whitespace-nowrap">${m.salary}</span>
        </div>
      `;

      el.addEventListener("click", () => {
        onSelectMarker?.(m);
      });

      const marker = new YMapMarker({ coordinates: m.coordinates }, el);
      map.addChild(marker);
      markerElements.push(marker);
    });

    // Render user location marker if available
    if (userLocation) {
      const uEl = document.createElement("div");
      uEl.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-xl flex items-center justify-center animate-pulse">
          <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
        </div>
      `;
      const userMarker = new YMapMarker({ coordinates: userLocation }, uEl);
      map.addChild(userMarker);
      markerElements.push(userMarker);
    }

    return () => {
      markerElements.forEach((mk) => {
        try {
          map.removeChild(mk);
        } catch {}
      });
    };
  }, [markers, selectedMarkerId, userLocation, onSelectMarker]);

  return (
    <div className={`relative overflow-hidden bg-[#06140F] border border-[#1A3D2E] shadow-2xl ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#06140F]/90 backdrop-blur-md">
          <div className="w-10 h-10 rounded-full border-4 border-[#00A86B]/20 border-t-[#00A86B] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#00A86B] uppercase tracking-widest animate-pulse">
            Загрузка Яндекс Карт v3...
          </p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#06140F] p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
          <p className="text-xs font-bold text-red-300 max-w-xs">{error}</p>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full min-h-[350px]" />
    </div>
  );
}

export default YandexMap;