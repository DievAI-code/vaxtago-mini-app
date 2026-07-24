"use client";

import { useEffect, useRef, useState } from "react";
import { get2GISMapKey } from "@/lib/env";
import { AlertCircle, Loader2 } from "lucide-react";

declare global {
  interface Window {
    DG: any;
  }
}

let sdkLoadingPromise: Promise<void> | null = null;

function load2GISSDK(apiKey: string): Promise<void> {
  if (window.DG) {
    return Promise.resolve();
  }

  if (sdkLoadingPromise) {
    return sdkLoadingPromise;
  }

  sdkLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.api.2gis.ru/2.0/load.js?pkg=full&mode=release&key=${apiKey}`;
    script.async = true;
    script.onload = () => {
      if (window.DG) {
        resolve();
      } else {
        reject(new Error("2GIS SDK failed to load"));
      }
    };
    script.onerror = () => {
      sdkLoadingPromise = null;
      reject(new Error("Failed to load 2GIS Maps SDK script"));
    };
    document.body.appendChild(script);
  });

  return sdkLoadingPromise;
}

interface Map2GISProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: any[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: any) => void;
  userLocation?: [number, number] | null; // [lat, lng]
  className?: string;
  autoOpenPopup?: boolean;
}

export function Map2GIS({
  center,
  zoom = 12,
  markers = [],
  selectedMarkerId = null,
  onSelectMarker,
  userLocation,
  className = "w-full h-full min-h-[350px] rounded-[2rem]",
  autoOpenPopup = false,
}: Map2GISProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRefs = useRef<Record<string, any>>({});
  const userMarkerRef = useRef<any>(null);

  const [sdkState, setSdkState] = useState<"loading" | "ready" | "error" | "no_key">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const apiKey = get2GISMapKey();

  useEffect(() => {
    if (!apiKey) {
      setSdkState("no_key");
      return;
    }

    load2GISSDK(apiKey)
      .then(() => {
        setSdkState("ready");
      })
      .catch((err) => {
        console.error("[2GIS SDK]", err);
        setErrorMessage("Не удалось загрузить карты");
        setSdkState("error");
      });
  }, [apiKey]);

  useEffect(() => {
    if (sdkState !== "ready" || !containerRef.current || !window.DG) return;

    window.DG.then(() => {
      if (!containerRef.current || mapRef.current) return;

      try {
        const map = window.DG.map(containerRef.current, {
          center: [center[0], center[1]],
          zoom: zoom,
          zoomControl: true,
          fullscreenControl: false,
        });

        mapRef.current = map;
        updateMarkers();
        if (userLocation) {
          updateUserMarker();
        }
      } catch (e: any) {
        console.error("Error initializing 2GIS Map:", e);
        setErrorMessage("Ошибка инициализации карты 2ГИС");
        setSdkState("error");
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [sdkState]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([center[0], center[1]], zoom);
    }
  }, [center, zoom]);

  const updateMarkers = () => {
    if (!mapRef.current || !window.DG) return;

    Object.values(markerRefs.current).forEach((m) => m.remove());
    markerRefs.current = {};

    markers.forEach((m) => {
      const isSelected = selectedMarkerId === m.id;
      const title = m.title || m.employerName || m.address || "Объект";
      const salary = m.salary ? ` (${m.salary})` : "";

      const marker = window.DG.marker([m.coordinates[0], m.coordinates[1]]).addTo(mapRef.current);

      marker.bindPopup(`<div style="color:#000; font-weight:600; font-size:12px; padding:4px;">${title}${salary}</div>`);

      marker.on("click", () => {
        if (onSelectMarker) {
          onSelectMarker(m);
        }
      });

      markerRefs.current[m.id] = marker;

      if (isSelected || autoOpenPopup) {
        marker.openPopup();
      }
    });
  };

  useEffect(() => {
    if (mapRef.current) {
      updateMarkers();
    }
  }, [markers, selectedMarkerId, autoOpenPopup]);

  const updateUserMarker = () => {
    if (!mapRef.current || !userLocation || !window.DG) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }
    const marker = window.DG.marker([userLocation[0], userLocation[1]]).addTo(mapRef.current);
    marker.bindPopup(`<div style="color:#000; font-weight:700; font-size:12px; padding:4px;">Вы здесь</div>`);
    userMarkerRef.current = marker;
  };

  useEffect(() => {
    if (mapRef.current && userLocation) {
      updateUserMarker();
    }
  }, [userLocation]);

  if (sdkState === "no_key") {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-[#06140F] border border-[#1A3D2E] text-[#5C7A6D] text-xs font-bold text-center gap-2 ${className}`}>
        <AlertCircle className="text-amber-400" size={24} />
        <span>Не настроен ключ 2ГИС</span>
      </div>
    );
  }

  if (sdkState === "error") {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-[#06140F] border border-red-500/20 text-red-400 text-xs font-bold text-center gap-2 ${className}`}>
        <AlertCircle className="text-red-400" size={24} />
        <span>{errorMessage || "Не удалось загрузить карты"}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#06140F] border border-[#1A3D2E] shadow-2xl ${className}`}>
      {sdkState === "loading" && (
        <div className="absolute inset-0 bg-[#06140F] z-10 flex flex-col items-center justify-center gap-2 text-[#00A86B]">
          <Loader2 className="animate-spin" size={28} />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">Загрузка карты 2ГИС...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" style={{ background: "#06140F" }} />
    </div>
  );
}

export default Map2GIS;