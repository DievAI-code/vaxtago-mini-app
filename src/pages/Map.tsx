"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Navigation, Crosshair, MapPin, ExternalLink, 
  Car, Footprints, Bus, Clock, Ruler, X, Loader2
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Map } from "@/components/Map";
import { geocodingService } from "@/services/geocodingService";
import { locationService } from "@/services/locationService";
import { routeService, TravelMode } from "@/services/maps/routeService";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

export default function MapPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [center, setCenter] = useState<[number, number]>([41.2995, 69.2401]);
  const [zoom, setZoom] = useState(12);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedDest, setSelectedDest] = useState<any>(null);
  
  // Route state
  const [routeMode, setRouteMode] = useState<TravelMode>("car");
  const [routeInfo, setRouteInfo] = useState<{ dist: string; time: string; coords: [number, number][] } | null>(null);
  const [isBuildingRoute, setIsBuildingRoute] = useState(false);

  // Handle query params for AI route requests
  useEffect(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const modeParam = searchParams.get("mode") as TravelMode | null;
    
    if (toParam) {
      if (modeParam) setRouteMode(modeParam);
      handleRouteSearch(fromParam || undefined, toParam);
      // Clear params after processing
      setSearchParams({});
    }
  }, [searchParams]);

  const handleRouteSearch = async (from?: string, to?: string) => {
    if (!to) return;
    setIsBuildingRoute(true);
    
    try {
      let fromCoords: [number, number] | null = userLocation;
      
      // If "from" is provided and not current location, geocode it
      if (from && from !== "Текущее местоположение") {
        const fromResults = await geocodingService.searchAddress(from);
        if (fromResults.length > 0) {
          fromCoords = [fromResults[0].latitude, fromResults[0].longitude];
        }
      }
      
      // If no from coords yet, try to get user location
      if (!fromCoords && "geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          fromCoords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(fromCoords);
        } catch {
          toast.error("Не удалось определить местоположение. Укажите начальную точку.");
        }
      }
      
      // Geocode destination
      const toResults = await geocodingService.searchAddress(to);
      if (toResults.length === 0) {
        toast.error("Адрес назначения не найден");
        return;
      }
      
      const toCoords: [number, number] = [toResults[0].latitude, toResults[0].longitude];
      setSelectedDest(toResults[0]);
      setCenter(toCoords);
      setZoom(14);
      
      // Build route if we have from coords
      if (fromCoords) {
        const route = await routeService.buildRoute(fromCoords, toCoords, routeMode);
        if (route) {
          setRouteInfo({
            dist: `${route.distanceKm} км`,
            time: `${route.durationMins} мин`,
            coords: route.geometry,
          });
          toast.success("Маршрут построен!");
        } else {
          toast.info("Маршрут сформирован по прямым координатам");
        }
      }
    } catch (err) {
      toast.error("Ошибка построения маршрута");
    } finally {
      setIsBuildingRoute(false);
    }
  };

  const handleAddressSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await geocodingService.searchAddress(searchQuery);
      if (results.length > 0) {
        const first = results[0];
        setCenter([first.latitude, first.longitude]);
        setZoom(15);
        setSelectedDest(first);
        setRouteInfo(null); // Clear previous route
        toast.success("Адрес найден");
      } else {
        toast.error("Ничего не найдено");
      }
    } catch {
      toast.error("Ошибка поиска");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateUser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          setCenter(coords);
          setZoom(14);
          toast.success("Ваше местоположение определено");
        },
        () => toast.error("Не удалось определить геопозицию")
      );
    }
  };

  const buildRouteToDest = async () => {
    if (!selectedDest || !userLocation) {
      toast.info("Определяем ваше местоположение...");
      handleLocateUser();
      return;
    }
    setIsBuildingRoute(true);
    try {
      const toCoords: [number, number] = [selectedDest.latitude, selectedDest.longitude];
      const route = await routeService.buildRoute(userLocation, toCoords, routeMode);
      if (route) {
        setRouteInfo({
          dist: `${route.distanceKm} км`,
          time: `${route.durationMins} мин`,
          coords: route.geometry,
        });
        toast.success("Маршрут построен!");
      }
    } catch {
      toast.error("Ошибка построения маршрута");
    } finally {
      setIsBuildingRoute(false);
    }
  };

  const MODES: { id: TravelMode; icon: any; label: string }[] = [
    { id: "car", icon: Car, label: "Авто" },
    { id: "walking", icon: Footprints, label: "Пешком" },
    { id: "transport", icon: Bus, label: "Транспорт" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.map" showBack />

      <main className="px-4 mt-2 flex-1 space-y-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>🗺️</span> {t("maps.title") || "Карта"}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
              VAQTA AI Navigation
            </p>
          </div>
          <button
            onClick={handleLocateUser}
            className="p-3 bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl text-[#00A86B] hover:scale-105 active:scale-95 transition-all shadow-lg"
            title="Определить мое местоположение"
          >
            <Crosshair size={18} />
          </button>
        </div>

        <div className="relative vaqta-glass border-[#1A3D2E] p-2 focus-within:border-[#00A86B]/50 transition-all shadow-xl">
          <div className="flex items-center gap-3 px-3">
            <Search size={18} className="text-[#00A86B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
              placeholder={t("maps.search_ph") || "Введите адрес..."}
              className="flex-1 bg-transparent py-3 text-xs outline-none placeholder-[#5C7A6D] font-bold text-white"
            />
            {isSearching && <Loader2 className="animate-spin text-[#00A86B]" size={18} />}
            <button
              onClick={handleAddressSearch}
              disabled={isSearching}
              className="bg-[#00A86B] px-4 py-2.5 rounded-xl text-xs font-black text-white hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isSearching ? "..." : "Найти"}
            </button>
          </div>
        </div>

        {/* Transport Mode Selector */}
        <div className="flex gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = routeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setRouteMode(m.id)}
                className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                  active
                    ? "bg-[#00A86B] text-white shadow-lg"
                    : "bg-white/5 text-[#5C7A6D] border border-white/10"
                }`}
              >
                <Icon size={14} />
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 min-h-[360px] md:min-h-[450px]">
          <Map
            center={center}
            zoom={zoom}
            markers={selectedDest ? [{ id: 'dest', title: selectedDest.name, coordinates: [selectedDest.latitude, selectedDest.longitude] }] : []}
            userLocation={userLocation}
            className="w-full h-full rounded-[2.5rem]"
          />
        </div>

        <AnimatePresence>
          {routeInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="vaqta-glass p-5 border-[#00A86B]/30 space-y-3 shadow-2xl"
            >
              <div className="flex items-center gap-2 text-[#00A86B]">
                <Navigation size={18} />
                <span className="text-xs font-black uppercase tracking-wider">Маршрут построен</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl">
                  <Clock size={16} className="text-[#D4AF37]" />
                  <div>
                    <p className="text-lg font-black">{routeInfo.time}</p>
                    <p className="text-[9px] uppercase font-bold text-[#5C7A6D]">Время</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl">
                  <Ruler size={16} className="text-[#00A86B]" />
                  <div>
                    <p className="text-lg font-black">{routeInfo.dist}</p>
                    <p className="text-[9px] uppercase font-bold text-[#5C7A6D]">Расстояние</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const [lat, lng] = center;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
                }}
                className="w-full h-12 vaqta-gradient rounded-2xl text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                <ExternalLink size={14} />
                Открыть в Google Maps
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedDest && !routeInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="vaqta-glass p-5 border-[#1A3D2E] space-y-3"
          >
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#00A86B]" />
              <span className="text-sm font-bold">{selectedDest.name || selectedDest.display_name}</span>
            </div>
            <button
              onClick={buildRouteToDest}
              disabled={isBuildingRoute}
              className="w-full h-12 vaqta-gradient rounded-2xl text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform disabled:opacity-50"
            >
              {isBuildingRoute ? <Loader2 className="animate-spin" size={16} /> : <Navigation size={16} />}
              {isBuildingRoute ? "Строим маршрут..." : "Построить маршрут"}
            </button>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}