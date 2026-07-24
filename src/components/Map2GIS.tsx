"use client";

import { useEffect, useRef, useState } from "react";
import { get2GISMapKey } from "@/lib/env";
import { twoGisService } from "@/services/maps/twoGis";
import { MapOSM } from "./MapOSM";
import { AlertCircle, Loader2 } from "lucide-react";

interface Map2GISProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: any[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: any) => void;
  userLocation?: [number, number] | null;
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
  const [status, setStatus] = useState<"loading" | "ready" | "fallback" | "no_key">("loading");

  const apiKey = get2GISMapKey();

  useEffect(() => {
    if (!apiKey) {
      setStatus("no_key");
      return;
    }

    let isMounted = true;

    twoGisService
      .loadSDK()
      .then((sdk) => {
        if (!isMounted || !containerRef.current || mapRef.current) return;
        try {
          const map = twoGisService.createMap(
            { container: containerRef.current, center, zoom },
            sdk
          );
          mapRef.current = map;
          setStatus("ready");
        } catch (e) {
          console.warn("[2GIS Map Creation Error] Switching to OpenStreetMap fallback:", e);
          setStatus("fallback");
        }
      })
      .catch((err) => {
        console.warn("[2GIS SDK Load Error] Switching to OpenStreetMap fallback:", err);
        if (isMounted) setStatus("fallback");
      });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        try {
          if (mapRef.current.destroy) mapRef.current.destroy();
          else if (mapRef.current.remove) mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
    };
  }, [apiKey]);

  // Handle center / zoom changes
  useEffect(() => {
    if (mapRef.current && status === "ready") {
      twoGisService.centerMap(mapRef.current, center, zoom);
    }
  }, [center, zoom, status]);

  // Handle marker updates
  useEffect(() => {
    if (!mapRef.current || status !== "ready") return;

    markers.forEach((m) => {
      const coords: [number, number] = m.coordinates || [center[0], center[1]];
      const title = m.title || m.employerName || m.address || "Объект";
      twoGisService.addMarker(mapRef.current, coords, title, () => {
        if (onSelectMarker) onSelectMarker(m);
      });
    });
  }, [markers, selectedMarkerId, status]);

  if (status === "no_key") {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-[#06140F] border border-[#1A3D2E] text-[#5C7A6D] text-xs font-bold text-center gap-2 ${className}`}>
        <AlertCircle className="text-amber-400" size={24} />
        <span>Не настроен ключ 2ГИС</span>
      </div>
    );
  }

  if (status === "fallback") {
    return (
      <MapOSM
        center={center}
        zoom={zoom}
        markers={markers}
        selectedMarkerId={selectedMarkerId}
        onSelectMarker={onSelectMarker}
        userLocation={userLocation}
        className={className}
        autoOpenPopup={autoOpenPopup}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#06140F] border border-[#1A3D2E] shadow-2xl ${className}`}>
      {status === "loading" && (
        <div className="absolute inset-0 bg-[#06140F] z-10 flex flex-col items-center justify-center gap-2 text-[#00A86B]">
          <Loader2 className="animate-spin" size={28} />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">Загрузка карты 2ГИС...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: "350px", background: "#06140F" }} />
    </div>
  );
}

export default Map2GIS;