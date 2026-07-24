"use client";

import { is2GISAvailable } from "@/services/mapProvider";
import { Map2GIS } from "./Map2GIS";
import { MapOSM } from "./MapOSM";

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
  const mapProps = {
    center,
    zoom,
    markers,
    selectedMarkerId,
    onSelectMarker,
    userLocation,
    className,
    autoOpenPopup,
  };

  if (is2GISAvailable()) {
    return <Map2GIS {...mapProps} />;
  }

  return <MapOSM {...mapProps} />;
}

export default Map;