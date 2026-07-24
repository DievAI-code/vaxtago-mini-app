"use client";

import { useEffect, useRef, useState } from "react";
import { loadYandexMaps } from "@/lib/yandexMaps";
import { hasYandexMapsKey } from "@/config/maps";

// Leaflet imports for OSM fallback
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const customIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export interface VacancyMarkerData {
  id: string;
  title: string;
  salary: string;
  city: string;
  address: string;
  coordinates: [number, number];
  type: "employer" | "verified" | "premium";
  employerName: string;
  schedule?: string;
  url?: string;
}

interface YandexMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: VacancyMarkerData[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: VacancyMarkerData) => void;
  userLocation?: [number, number] | null;
  className?: string;
}

export function YandexMap({
  center = [69.2401, 41.2995],
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
  const [useOsmFallback, setUseOsmFallback] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!hasYandexMapsKey) {
      console.warn("[YandexMap] API Key missing. Rendering fallback UI.");
      setUseOsmFallback(true);
      setLoading(false);
      return;
    }

    loadYandexMaps()
      .then((success) => {
        if (!mounted) return;

        if (!success) {
          console.warn("[YandexMap] Yandex API failed to load. Switching to OpenStreetMap fallback.");
          setUseOsmFallback(true);
          setLoading(false);
          return;
        }

        const ymaps = (window as any).ymaps3;
        if (!ymaps) {
          setUseOsmFallback(true);
          setLoading(false);
          return;
        }

        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = ymaps;

        if (mapInstanceRef.current) {
          try { mapInstanceRef.current.destroy(); } catch {}
          mapInstanceRef.current = null;
        }
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = "";
        }

        const map = new YMap(mapContainerRef.current!, {
          location: { center, zoom },
        });

        map.addChild(new YMapDefaultSchemeLayer({}));
        map.addChild(new YMapDefaultFeaturesLayer({}));

        mapInstanceRef.current = map;
        setLoading(false);
      })
      .catch(() => {
        if (mounted) {
          setUseOsmFallback(true);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.destroy(); } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && center) {
      try {
        mapInstanceRef.current.setLocation({ center, zoom, duration: 300 });
      } catch {}
    }
  }, [center[0], center[1], zoom]);

  useEffect(() => {
    if (useOsmFallback || !mapInstanceRef.current) return;

    const ymaps = (window as any).ymaps3;
    const { YMapMarker } = ymaps;
    const map = mapInstanceRef.current;
    const markerElements: any[] = [];

    markers.forEach((m) => {
      const isSelected = selectedMarkerId === m.id;
      const el = document.createElement("div");
      el.className = "cursor-pointer transition-transform transform hover:scale-110 active:scale-95";

      let badgeBg = "bg-red-500 text-white border-red-400";
      let icon = "🔴";
      if (m.type === "verified") { badgeBg = "bg-[#00A86B] text-white border-[#00D4A8]"; icon = "🟢"; }
      else if (m.type === "premium") { badgeBg = "bg-[#D4AF37] text-black border-yellow-300 font-bold"; icon = "⭐"; }

      el.innerHTML = `
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-2xl border ${badgeBg} ${isSelected ? "ring-4 ring-white scale-110 z-50" : ""}">
          <span class="text-xs">${icon}</span>
          <span class="text-[11px] font-black tracking-tight whitespace-nowrap">${m.salary || m.title}</span>
        </div>
      `;

      el.addEventListener("click", () => onSelectMarker?.(m));

      try {
        const marker = new YMapMarker({ coordinates: m.coordinates }, el);
        map.addChild(marker);
        markerElements.push(marker);
      } catch {}
    });

    if (userLocation) {
      const uEl = document.createElement("div");
      uEl.innerHTML = `<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-xl flex items-center justify-center animate-pulse"><div class="w-2.5 h-2.5 rounded-full bg-white"></div></div>`;
      try {
        const userMarker = new YMapMarker({ coordinates: userLocation }, uEl);
        map.addChild(userMarker);
        markerElements.push(userMarker);
      } catch {}
    }

    return () => {
      markerElements.forEach((mk) => { try { map.removeChild(mk); } catch {} });
    };
  }, [markers, selectedMarkerId, userLocation, onSelectMarker, useOsmFallback]);

  if (useOsmFallback) {
    const lat = center[1];
    const lng = center[0];
    const leafletCenter: [number, number] = [lat, lng];

    return (
      <div className={`relative overflow-hidden bg-[#06140F] border border-[#1A3D2E] shadow-2xl ${className}`}>
        <MapContainer
          center={leafletCenter}
          zoom={zoom}
          scrollWheelZoom={false}
          className="w-full h-full"
          style={{ background: "#06140F" }}
        >
          <ChangeView center={leafletCenter} zoom={zoom} />
          <TileLayer
            attribution='&copy; OpenStreetMap &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {markers.map((m) => (
            <Marker
              key={m.id}
              position={[m.coordinates[1], m.coordinates[0]]}
              icon={customIcon}
              eventHandlers={{ click: () => onSelectMarker?.(m) }}
            >
              <Popup>
                <div className="text-black font-semibold text-xs p-1">{m.title}</div>
              </Popup>
            </Marker>
          ))}
          {userLocation && (
            <Marker position={[userLocation[1], userLocation[0]]} icon={customIcon} />
          )}
        </MapContainer>
        <div className="absolute top-2 left-2 z-[1000] bg-[#0C1F1A]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#1A3D2E] text-[10px] font-bold text-[#00A86B] uppercase tracking-widest pointer-events-none">
          Карта временно недоступна. Используем резервную карту.
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#06140F] border border-[#1A3D2E] shadow-2xl ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#06140F]/90 backdrop-blur-md">
          <div className="w-10 h-10 rounded-full border-4 border-[#00A86B]/20 border-t-[#00A86B] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#00A86B] uppercase tracking-widest animate-pulse">Загрузка карты...</p>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px]" />
    </div>
  );
}

export default YandexMap;