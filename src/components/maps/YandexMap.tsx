"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { loadYandexMaps } from "@/lib/yandexMaps";

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

export function YandexMap({
  center = [69.2401, 41.2995], // Tashkent [lng, lat]
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

    loadYandexMaps()
      .then(() => {
        if (!mounted || !mapContainerRef.current) return;

        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } =
          window.ymaps3;

        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.destroy();
          } catch {}
          mapInstanceRef.current = null;
        }
        mapContainerRef.current.innerHTML = "";

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
          console.error("[YandexMap] Error:", err);
          setError("Карта временно недоступна. Проверьте подключение.");
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

  useEffect(() => {
    if (mapInstanceRef.current && center) {
      try {
        mapInstanceRef.current.setLocation({
          center,
          zoom,
          duration: 300,
        });
      } catch (err) {
        console.warn("[YandexMap] setLocation failed:", err);
      }
    }
  }, [center[0], center[1], zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.ymaps3) return;

    const { YMapMarker } = window.ymaps3;
    const map = mapInstanceRef.current;
    const markerElements: any[] = [];

    markers.forEach((m) => {
      const isSelected = selectedMarkerId === m.id;
      const el = document.createElement("div");
      el.className =
        "cursor-pointer transition-transform transform hover:scale-110 active:scale-95";

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
    <div
      className={`relative overflow-hidden bg-[#06140F] border border-[#1A3D2E] shadow-2xl ${className}`}
    >
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