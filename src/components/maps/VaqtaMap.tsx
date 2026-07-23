"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, ExternalLink, X } from "lucide-react";
import { yandexMapsService } from "@/services/yandexMaps";
import { GeocodingResult } from "@/services/yandexMaps";

interface VaqtaMapProps {
  searchQuery?: string;
  coordinates?: [number, number];
  onClose?: () => void;
  onLocationSelect?: (result: GeocodingResult) => void;
}

export function VaqtaMap({ searchQuery, coordinates, onClose, onLocationSelect }: VaqtaMapProps) {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else if (coordinates) {
      handleReverseGeocode(coordinates);
    }
  }, [searchQuery, coordinates]);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await yandexMapsService.searchAddress(query);
      setResults(results);
      
      if (results.length > 0) {
        setSelectedLocation(results[0]);
        onLocationSelect?.(results[0]);
      } else {
        setError("Адрес не найден");
      }
    } catch (err) {
      setError("Ошибка поиска адреса");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReverseGeocode = async (coords: [number, number]) => {
    setLoading(true);
    
    try {
      const address = await yandexMapsService.reverseGeocode(coords[0], coords[1]);
      if (address) {
        const location: GeocodingResult = {
          latitude: coords[0],
          longitude: coords[1],
          address: address,
          display_name: address
        };
        setSelectedLocation(location);
        setResults([location]);
        onLocationSelect?.(location);
      }
    } catch (err) {
      console.error("Reverse geocode error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInYandexMaps = () => {
    if (selectedLocation) {
      yandexMapsService.openYandexMaps(
        [selectedLocation.longitude, selectedLocation.latitude],
        selectedLocation.address
      );
    }
  };

  const handleBuildRoute = () => {
    if (selectedLocation) {
      // Можно добавить выбор начальной точки
      const defaultFrom: [number, number] = [55.7558, 37.6173]; // Москва
      yandexMapsService.openYandexRoute(
        defaultFrom,
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

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

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
          onClick={handleOpenInYandexMaps}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ExternalLink size={16} />
          Открыть в Яндекс Картах
        </button>

        <button
          onClick={handleBuildRoute}
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
                onClick={() => {
                  setSelectedLocation(result);
                  onLocationSelect?.(result);
                }}
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