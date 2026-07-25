"use client";

import { load2GISSDK, twoGisService } from "@/services/maps/twoGis";

export interface DGISLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface DGISRoute {
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][]; // [lat, lng] coordinates
  steps: {
    instruction: string;
    distance: number;
  }[];
}

class DGISProvider {
  private map: any = null;
  private markers: any[] = [];
  private routeLayer: any = null;

  async initializeMap(container: HTMLElement, center: [number, number], zoom: number = 12): Promise<boolean> {
    try {
      const sdk = await load2GISSDK();
      this.map = twoGisService.createMap(
        { container, center, zoom },
        sdk
      );
      return true;
    } catch (error) {
      console.error("[DGIS] Failed to initialize map:", error);
      return false;
    }
  }

  async searchAddress(query: string): Promise<DGISLocation[]> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY || "";
      const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&key=${apiKey}&fields=items.point,items.name,items.address_name&limit=10`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Search failed");
      
      const data = await response.json();
      const items = data.result?.items || [];
      
      return items.map((item: any) => ({
        id: item.id,
        name: item.name,
        address: item.address_name || item.full_name || "",
        latitude: item.point?.lat,
        longitude: item.point?.lon,
      })).filter((loc: DGISLocation) => loc.latitude && loc.longitude);
    } catch (error) {
      console.error("[DGIS] Search error:", error);
      return [];
    }
  }

  async geocodeAddress(address: string): Promise<[number, number] | null> {
    const results = await this.searchAddress(address);
    if (results.length > 0) {
      return [results[0].latitude, results[0].longitude];
    }
    return null;
  }

  async buildRoute(from: [number, number], to: [number, number], mode: "car" | "walking" = "car"): Promise<DGISRoute | null> {
    try {
      // Use 2GIS Directions API
      const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY || "";
      const profile = mode === "walking" ? "pedestrian" : "car";
      
      const url = `https://routing.api.2gis.com/routing/7.0.0/global?key=${apiKey}`;
      
      const body = {
        points: [
          { lat: from[0], lon: from[1] },
          { lat: to[0], lon: to[1] }
        ],
        type: profile,
        options: {
          traffic_timestamp: "now"
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        // Fallback to OSRM if 2GIS routing fails
        return this.fallbackRoute(from, to, mode);
      }

      const data = await response.json();
      const route = data.result?.[0];
      
      if (!route) return null;

      return {
        distanceMeters: route.length || 0,
        durationSeconds: route.duration || 0,
        geometry: this.decodeGeometry(route.geometry),
        steps: route.legs?.[0]?.steps?.map((step: any) => ({
          instruction: step.text || "Продолжайте движение",
          distance: step.length || 0
        })) || []
      };
    } catch (error) {
      console.error("[DGIS] Route error:", error);
      return this.fallbackRoute(from, to, mode);
    }
  }

  private async fallbackRoute(from: [number, number], to: [number, number], mode: "car" | "walking"): Promise<DGISRoute | null> {
    // Use OSRM as fallback
    try {
      const profile = mode === "walking" ? "foot" : "car";
      const url = `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Fallback route failed");
      
      const data = await response.json();
      const route = data.routes?.[0];
      
      if (!route) return null;

      return {
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        geometry: route.geometry.coordinates.map((c: any) => [c[1], c[0]]),
        steps: route.legs[0].steps.map((s: any) => ({
          instruction: s.maneuver.instruction,
          distance: s.distance
        }))
      };
    } catch {
      return null;
    }
  }

  private decodeGeometry(geometry: string): [number, number][] {
    // Simple polyline decoder for 2GIS geometry
    if (!geometry) return [];
    
    try {
      // If it's already an array of coordinates
      if (Array.isArray(geometry)) {
        return geometry.map((c: any) => [c.lat || c[0], c.lon || c[1]]);
      }
      
      // If it's a polyline string, use a basic decoder
      return this.decodePolyline(geometry);
    } catch {
      return [];
    }
  }

  private decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      points.push([lat / 1e5, lng / 1e5]);
    }

    return points;
  }

  addMarker(coordinates: [number, number], title: string, onClick?: () => void): any {
    if (!this.map) return null;
    
    const marker = twoGisService.addMarker(this.map, coordinates, title, onClick);
    this.markers.push(marker);
    return marker;
  }

  clearMarkers(): void {
    this.markers.forEach(m => {
      if (m && typeof m.remove === 'function') {
        m.remove();
      }
    });
    this.markers = [];
  }

  displayRoute(route: DGISRoute): void {
    if (!this.map || !route.geometry.length) return;

    // Clear previous route
    if (this.routeLayer) {
      this.routeLayer.remove();
    }

    // Create polyline for the route
    const coordinates = route.geometry.map(c => [c[1], c[0]]); // Convert to [lng, lat] for 2GIS
    
    // Add route line to map
    this.routeLayer = (window as any).DG?.polyline(coordinates, {
      color: '#00A86B',
      weight: 5,
      opacity: 0.8
    }).addTo(this.map);

    // Fit bounds to show entire route
    const bounds = (window as any).DG?.latLngBounds(route.geometry.map(c => [c[0], c[1]]));
    if (bounds) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  centerMap(coordinates: [number, number], zoom?: number): void {
    if (!this.map) return;
    twoGisService.centerMap(this.map, coordinates, zoom);
  }

  getMapInstance(): any {
    return this.map;
  }

  destroy(): void {
    this.clearMarkers();
    if (this.routeLayer) {
      this.routeLayer.remove();
    }
    if (this.map) {
      if (typeof this.map.destroy === 'function') {
        this.map.destroy();
      } else if (typeof this.map.remove === 'function') {
        this.map.remove();
      }
    }
    this.map = null;
  }
}

export const dgisProvider = new DGISProvider();