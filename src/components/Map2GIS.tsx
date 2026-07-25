"use client";

import { useEffect, useRef, useState } from "react";
import { MapOSM } from "./MapOSM";
import { AlertCircle, Loader2 } from "lucide-react";
import { appStorage } from "@/lib/appStorage";

interface Map2GISProps {
  center: [number, number];
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
  const [status, setStatus] = useState<"ready" | "fallback">("ready");

  useEffect(() => {
    appStorage.saveMapState({
      center: [center[0], center[1]],
      zoom,
      updatedAt: Date.now(),
    });
  }, [center, zoom]);

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

export default Map2GIS;