"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, ExternalLink, X, Search, RefreshCw } from "lucide-react";
import { yandexMapsService, GeocodingResult } from "@/services/yandexMaps";

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
  const [manualQuery, setManualQuery] = useState(searchQuery || "");

  useEffect(() => {
    if (searchQuery) {
      setManualQuery(searchQuery);
      handleSearch(searchQuery);
    } else if (coordinates) {
      handleReverseGeocode(coordinates);
    }
  }, [searchQuery, coordinates]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const searchResults = await yandexMapsService.searchAddress(query);
      setResults(searchResults);

      if (searchResults.length > 0) {
        setSelectedLocation(searchResults[0]);
        onLocationSelect?.(searchResults[0]);
      } else {
        setError(`Не удалось найти место: "${query}". Уточните название города или улицы.`);
      }
    } catch (err) {
      setError("Не удалось открыть карту. Вот адрес: " + query);
      console.error("[VaqtaMap] Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReverseGeocode = async (coords: [number, number]) => {
    setLoading(true);

    try {
      const address = await yandexMapsService.reverseGeocode(coords[1], coords[0]);
      if (address) {
        const location: GeocodingResult = {
          latitude: coords[1],
          longitude: coords[0],
          address: address,
          display_name: address
        };
        setSelectedLocation(location);
        setResults([location]);
        onLocationSelect?.(location);
      }
    } catch (err) {
      console.error("[VaqtaMap] Reverse geocode error:", err);
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
    } else if (manualQuery) {
      window.open(`https://yandex.ru/maps/?text=${encodeURIComponent(manualQuery)}`, "_blank");
    }
  };

  const handleBuildRoute = () => {
    if (selectedLocation) {
      yandexMapsService.openRouteToDestination(
        selectedLocation.latitude,
        selectedLocation.longitude,
        selectedLocation.address
      );
    } else if (manualQuery) {
      window.open(`https://yandex.ru/maps/?rtext=~${encodeURIComponent(manualQuery)}&rtt=auto`, "_blank");
    }
  };

  return (
    <div className="vaqta-glass p-6 border-[#1A3D2E] shadow-2xl rounded-[2.5rem] relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-[#00A86B]" />
          <h3 className="text-base font-black uppercase text-white tracking-tight">VAQTA Maps</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 text-[#5C7A6D] hover:text-white transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Поисковая строка в виджете */}
      <div className="flex items-center gap-2 mb-4 bg-[#06140F] border border-[#1A3D2E] rounded-2xl px-3 py-1">
        <Search size={16} className="text-[#5C7A6D]" />
        <input
          type="text"
          value={manualQuery}
          onChange={(e) => setManualQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch(manualQuery)}
          placeholder="Поиск адреса..."
          className="flex-1 bg-transparent py-2.5 text-xs text-white outline-none placeholder-[#5C7A6D] font-bold"
        />
        <button
          onClick={() => handleSearch(manualQuery)}
          disabled={loading}
          className="p-2 bg-[#00A86B] text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 text-xs font-bold">
          <p>{error}</p>
        </div>
      )}

      {selectedLocation && (
        <div className="mb-4 p-4 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-2xl space-y-1">
          <p className="text-xs font-black text-[#00A86B] uppercase tracking-wider">Найденный адрес:</p>
          <p className="text-sm font-bold text-white">{selectedLocation.address}</p>
          <p className="text-[10px] text-[#5C7A6D]">{selectedLocation.display_name}</p>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleOpenInYandexMaps}
          className="h-12 bg-white/10 border border-white/20 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
        >
          <ExternalLink size={16} />
          <span>Яндекс Карты</span>
        </button>

        <button
          onClick={handleBuildRoute}
          className="h-12 vaqta-gradient text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl vaqta-glow hover:scale-[1.02] transition-transform"
        >
          <Navigation size={16} />
          <span>Маршрут</span>
        </button>
      </div>

      {results.length > 1 && (
        <div className="mt-4 pt-3 border-t border-[#1A3D2E]">
          <p className="text-[10px] font-black uppercase text-[#5C7A6D] mb-2">Другие варианты:</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
            {results.slice(1).map((res, i) => (
              <div
                key={i}
                onClick={() => {
                  setSelectedLocation(res);
                  onLocationSelect?.(res);
                }}
                className="p-2.5 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors text-xs"
              >
                <p className="font-bold text-white truncate">{res.address}</p>
                <p className="text-[10px] text-[#5C7A6D] truncate">{res.display_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}