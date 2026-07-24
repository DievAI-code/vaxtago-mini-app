"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapOSMProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: any[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: any) => void;
  userLocation?: [number, number] | null;
  className?: string;
  autoOpenPopup?: boolean;
}

export function MapOSM({
  center,
  zoom = 12,
  markers = [],
  selectedMarkerId,
  onSelectMarker,
  userLocation,
  className = "w-full h-full min-h-[350px] rounded-[2rem]",
}: MapOSMProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  useEffect(() => {
    if (!layerGroupRef.current || !mapRef.current) return;
    layerGroupRef.current.clearLayers();

    const customIcon = L.divIcon({
      className: "custom-osm-marker",
      html: `<div style="background-color:#00A86B;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    markers.forEach((m) => {
      const coords: [number, number] = m.coordinates || [center[0], center[1]];
      const marker = L.marker(coords, { icon: customIcon }).addTo(layerGroupRef.current!);
      const title = m.title || m.employerName || m.address || "Объект";
      marker.bindPopup(`<div style="color:#000;font-weight:600;font-size:12px;">${title}</div>`);

      if (onSelectMarker) {
        marker.on("click", () => onSelectMarker(m));
      }

      if (m.id === selectedMarkerId) {
        marker.openPopup();
      }
    });

    if (userLocation) {
      const userIcon = L.divIcon({
        className: "user-location-marker",
        html: `<div style="background-color:#2563EB;width:20px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(37,99,235,0.8);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      L.marker(userLocation, { icon: userIcon })
        .bindPopup("Вы здесь")
        .addTo(layerGroupRef.current!);
    }
  }, [markers, selectedMarkerId, userLocation]);

  return <div ref={containerRef} className={className} />;
}

export default MapOSM;