"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
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

const userIcon = L.divIcon({
  className: "",
  html: `<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-xl flex items-center justify-center animate-pulse"><div class="w-2.5 h-2.5 rounded-full bg-white"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export interface MapMarker {
  id: string;
  title: string;
  coordinates: [number, number]; // [lng, lat] format from our services
}

interface MapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: any[];
  userLocation?: [number, number] | null; // [lng, lat]
  className?: string;
  children?: React.ReactNode;
}

export function Map({
  center = [69.2401, 41.2995],
  zoom = 12,
  markers = [],
  userLocation,
  className = "w-full h-full min-h-[350px] rounded-[2rem]",
  children
}: MapProps) {
  // Convert [lng, lat] to [lat, lng] for Leaflet
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
          >
            <Popup>
              <div className="text-black font-semibold text-xs p-1">{m.title}</div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={[userLocation[1], userLocation[0]]} icon={userIcon} />
        )}
        
        {children}
      </MapContainer>
    </div>
  );
}

export default Map;