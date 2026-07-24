"use client";

import { get2GISMapKey } from "@/lib/env";

declare global {
  interface Window {
    mapgl?: any;
    DG?: any;
  }
}

let mapglLoadPromise: Promise<any> | null = null;

/**
 * Dynamically loads the official 2GIS MapGL JS SDK with script cache
 */
export function load2GISSDK(): Promise<any> {
  if (window.mapgl) {
    return Promise.resolve(window.mapgl);
  }

  if (mapglLoadPromise) {
    return mapglLoadPromise;
  }

  const apiKey = get2GISMapKey();

  mapglLoadPromise = new Promise((resolve, reject) => {
    // 1. Try MapGL SDK first (Modern 2GIS JS API v1)
    const script = document.createElement("script");
    script.src = `https://mapgl.2gis.com/api/js/v1`;
    script.async = true;

    script.onload = () => {
      if (window.mapgl) {
        resolve(window.mapgl);
      } else {
        // Fallback to DG 2.0 API if MapGL is not present
        loadDG20(apiKey).then(resolve).catch(reject);
      }
    };

    script.onerror = () => {
      // Fallback to DG 2.0 API on script error
      loadDG20(apiKey).then(resolve).catch((err) => {
        mapglLoadPromise = null;
        reject(err);
      });
    };

    document.head.appendChild(script);
  });

  return mapglLoadPromise;
}

function loadDG20(apiKey: string): Promise<any> {
  if (window.DG) return Promise.resolve({ isDG: true, DG: window.DG });

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.api.2gis.ru/2.0/load.js?pkg=full&key=${apiKey}`;
    script.async = true;

    script.onload = () => {
      if (window.DG) {
        resolve({ isDG: true, DG: window.DG });
      } else {
        reject(new Error("2GIS SDK failed to initialize"));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load 2GIS SDK script"));
    };

    document.head.appendChild(script);
  });
}

export interface MapInstanceOptions {
  container: HTMLElement;
  center: [number, number]; // [lat, lng]
  zoom?: number;
}

export const twoGisService = {
  loadSDK: load2GISSDK,

  createMap(options: MapInstanceOptions, sdk: any): any {
    const apiKey = get2GISMapKey();
    const [lat, lng] = options.center;

    if (sdk.isDG || window.DG) {
      const DG = window.DG;
      return DG.map(options.container, {
        center: [lat, lng],
        zoom: options.zoom || 12,
        zoomControl: true,
        fullscreenControl: false,
      });
    }

    if (window.mapgl) {
      return new window.mapgl.Map(options.container, {
        center: [lng, lat], // MapGL uses [lng, lat]
        zoom: options.zoom || 12,
        key: apiKey,
      });
    }

    throw new Error("SDK not loaded");
  },

  addMarker(map: any, coords: [number, number], title: string, onClick?: () => void): any {
    const [lat, lng] = coords;

    if (window.DG && map instanceof window.DG.Map) {
      const marker = window.DG.marker([lat, lng]).addTo(map);
      if (title) marker.bindPopup(`<div style="color:#000;font-weight:600;">${title}</div>`);
      if (onClick) marker.on("click", onClick);
      return marker;
    }

    if (window.mapgl) {
      const marker = new window.mapgl.Marker(map, {
        coordinates: [lng, lat],
      });
      if (onClick) {
        marker.on("click", onClick);
      }
      return marker;
    }

    return null;
  },

  centerMap(map: any, coords: [number, number], zoom = 14) {
    const [lat, lng] = coords;
    if (window.DG && map.setView) {
      map.setView([lat, lng], zoom);
    } else if (map.setCenter) {
      map.setCenter([lng, lat]);
      if (map.setZoom) map.setZoom(zoom);
    }
  },
};