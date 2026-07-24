"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, ExternalLink, X } from "lucide-react";
import { mapsService } from "@/services/maps";
import { GeocodingResult } from "@/services/maps";

interface MapWidgetProps {
  query?: string;
  coordinates?: [number, number];
  onClose?: () => void;
}

export function MapWidget({ query, coordinates, onClose }: MapWidgetProps) {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      searchAddress(query);
    } else if (coordinates) {
      reverseGeocode(coordinates);
    }
  }, [query, coordinates]);

  const searchAddress = async (address: string) => {
    setLoading(true);
    try {
      const results = await mapsService.searchAddress(address);
      setResults(results);
      if (results.length > 0) {
        setSelectedLocation(results[0]);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (coords: [number, number]) => {
    setLoading(true);
    try {
      const address = await mapsService.reverseGeocode(coords[0], coords[1]);
      if (address) {
        setResults([{
          latitude: coords[0],
          longitude: coords[1],
          address: address,
          display_name: address
        }]);
        setSelectedLocation({
          latitude: coords[0],
          longitude: coords[1],
          address: address,
          display_name: address
        });
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openInExternalMaps = () => {
    if (selectedLocation) {
      mapsService.openExternalMaps(
        [selectedLocation.longitude, selectedLocation.latitude],
        selectedLocation.address
      );
    }
  };

  const openRoute = () => {
    if (selectedLocation) {
      // Here you can implement choosing a starting point
      mapsService.openExternalRoute(
        [37.617494, 55.755826], // Moscow by default
        [selectedLocation.longitude, selectedLocation.latitude]
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Поиск...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Карта</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        )}
      </div>

      {selectedLocation && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center mb-2">
            <MapPin className="text-blue-600 mr-2" size={16} />
            <span className="font-medium">{selectedLocation.address}</span>
          </div>
          <p className="text-sm text-gray-600">{selectedLocation.display_name}</p>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={openInExternalMaps}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ExternalLink size={16} />
          Открыть в Картах
        </button>

        <button
          onClick={openRoute}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Navigation size={16} />
          Построить маршрут
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Результаты поиска:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedLocation(result)}
              >
                <p className="text-sm font-medium">{result.address}</p>
                <p className="text-xs text-gray-500">{result.display_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}