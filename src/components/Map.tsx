"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

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
  coordinates: [number, number]; // [lat, lng]
  type: "employer" | "verified" | "premium";
  employerName: string;
  schedule?: string;
  url?: string;
}

export interface MapMarker {
  id: string;
  title: string;
  coordinates: [number, number]; // [lat, lng]
}

interface MapProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: VacancyMarkerData[] | MapMarker[] | any[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: VacancyMarkerData | MapMarker | any) => void;
  userLocation?: [number, number] | null; // [lat, lng]
  className?: string;
  autoOpenPopup?: boolean;
}

function createVacancyIcon(marker: VacancyMarkerData, isSelected: boolean): L.DivIcon {
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

export function Map({
  center = [41.2995, 69.2401], // Tashkent [lat, lng]
  zoom = 12,
  markers = [],
  selectedMarkerId = null,
  onSelectMarker,
  userLocation,
  className = "w-full h-full min-h-[350px] rounded-[2rem]",
  autoOpenPopup = false,
}: MapProps) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  useEffect(() => {
    if (autoOpenPopup && markers.length > 0) {
      const firstMarkerId = markers[0].id;
      const marker = markerRefs.current[firstMarkerId];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [markers, autoOpenPopup]);

  return (
    <div className={`relative overflow-hidden bg-[#06140F] border border-[#1A3D2E] shadow-2xl ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ background: "#06140F" }}
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {markers.map((m: any) => {
          const isSelected = selectedMarkerId === m.id;
          const isVacancy = m.type !== undefined && m.salary !== undefined;

          const icon = isVacancy
            ? createVacancyIcon(m as VacancyMarkerData, isSelected)
            : defaultIcon;

          return (
            <Marker
              key={m.id}
              ref={(ref) => {
                markerRefs.current[m.id] = ref;
              }}
              position={[m.coordinates[0], m.coordinates[1]]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectMarker) {
                    onSelectMarker(m);
                  }
                },
              }}
            >
              <Popup>
                <div className="text-black font-semibold text-xs p-1">
                  {m.title || m.employerName || "Marker"}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {userLocation && (
          <Marker position={[userLocation[0], userLocation[1]]} icon={userIcon} />
        )}
      </MapContainer>
    </div>
  );
}

export default Map;