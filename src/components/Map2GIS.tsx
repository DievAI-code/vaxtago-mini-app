"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mapProvider } from "@/services/mapProvider";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.divIcon({
  className: "",
  html: `<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-xl flex items-center justify-center animate-pulse"><div class="w-2.5 h-2.5 rounded-full bg-white"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

declare global {
  interface Window {
    DG: any;
  }
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

function createVacancyIcon(marker: any, isSelected: boolean): L.DivIcon {
  let badgeBg = "bg-red-500 text-white border-red-400";
  let icon = "🔴";
  if (marker.type === "verified") {
    badgeBg = "bg-[#00A86B] text-white border-[#00D4A8]";
    icon = "🟢";
  } else if (marker.type === "premium") {
    badgeBg = "bg-[#D4AF37] text-black border-yellow-300 font-bold";
    icon = "⭐";
  }

  const scale = isSelected ? "scale-110" : "scale-100";
  const ring = isSelected ? "ring-4 ring-white" : "";
  const label = marker.salary || marker.title || "";

  return L.divIcon({
    className: "",
    html: `
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-2xl border ${badgeBg} ${scale} ${ring} transition-transform cursor-pointer whitespace-nowrap">
        <span class="text-xs">${icon}</span>
        <span class="text-[11px] font-black tracking-tight">${label}</span>
      </div>
    `,
    iconSize: [80, 32],
    iconAnchor: [40, 16],
  });
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

  const apiKey = mapProvider.get2GISKey();

  useEffect(() => {
    if (!apiKey) {
      console.error("2ГИС API ключ не настроен");
      return;
    }

    if (window.DG) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.api.2gis.ru/2.0/load.js?pkg=full&mode=release&key=${apiKey}`;
    script.async = true;
    script.onload = initMap;
    document.body.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [apiKey]);

  const initMap = () => {
    if (!containerRef.current || mapRef.current || !window.DG) return;

    mapRef.current = window.DG.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: false,
      backgroundColor: "#06140F",
    });

    updateMarkers();
    if (userLocation) {
      updateUserMarker();
    }
    if (autoOpenPopup && markers.length > 0) {
      const firstMarker = markers[0];
      const marker = markerRefs.current[firstMarker.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  const updateMarkers = () => {
    if (!mapRef.current) return;

    // Clear old markers
    Object.values(markerRefs.current).forEach((m) => m.remove());
    markerRefs.current = {};

    markers.forEach((m) => {
      const isSelected = selectedMarkerId === m.id;
      const isVacancy = m.type !== undefined && m.salary !== undefined;
      const icon = isVacancy ? createVacancyIcon(m, isSelected) : defaultIcon;

      const marker = window.DG.marker([m.coordinates[0], m.coordinates[1]], { icon }).addTo(mapRef.current);
      marker.bindPopup(`<div class="text-black font-semibold text-xs p-1">${m.title || m.employerName || "Marker"}</div>`);

      marker.on("click", () => {
        if (onSelectMarker) {
          onSelectMarker(m);
        }
      });

      markerRefs.current[m.id] = marker;
    });
  };

  useEffect(() => {
    if (mapRef.current) {
      updateMarkers();
      if (autoOpenPopup && markers.length > 0) {
        const marker = markerRefs.current[markers[0].id];
        if (marker) marker.openPopup();
      }
    }
  }, [markers, selectedMarkerId, autoOpenPopup]);

  const updateUserMarker = () => {
    if (!mapRef.current || !userLocation) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }
    userMarkerRef.current = window.DG.marker([userLocation[0], userLocation[1]], { icon: userIcon }).addTo(mapRef.current);
  };

  useEffect(() => {
    if (mapRef.current && userLocation) {
      updateUserMarker();
    }
  }, [userLocation]);

  return (
    <div className={`relative overflow-hidden bg-[#06140F] border border-[#1A3D2E] shadow-2xl ${className}`}>
      <div ref={containerRef} className="w-full h-full" style={{ background: "#06140F" }} />
    </div>
  );
}

export default Map2GIS;