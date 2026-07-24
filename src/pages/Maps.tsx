"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Crosshair, Navigation, Share2, Star, Loader2,
  AlertCircle, RefreshCw, Check, MapPin
} from "lucide-react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Map } from "@/components/Map";
import { geocodingService, GeocodingResult } from "@/services/geocodingService";
import { hybridMapSearch, RouteDetail } from "@/services/maps/search";
import { subscription } from "@/services/subscription";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageProvider";

export default function Maps() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || searchParams.get("query") || ""
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.2995, 69.2401]);
  const [zoom, setZoom] = useState(13);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const [routeInfo, setRouteInfo] = useState<RouteDetail | null>(null);
  const [buildingRoute, setBuildingRoute] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("query");
    if (q) {
      setSearchQuery(q);
      executeSearch(q);
    }
  }, [searchParams]);

  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) return;

    const access = await subscription.checkUserAccess("maps");
    if (!access.allowed) {
      toast.error("Лимит поисков на карте исчерпан.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setRouteInfo(null);

    try {
      // Pass userLocation for better 2GIS ranking
      const { results, error } = await geocodingService.searchAddressFull(queryText, userLocation || undefined);
      await subscription.trackUsage("maps");

      if (results.length > 0) {
        setSearchResults(results);
        const top = results[0];
        setSelectedLocation(top);
        setMapCenter([top.latitude, top.longitude]);
        setZoom(14);
        toast.success(`Найдено: ${top.name}`);
      } else {
        setSearchResults([]);
        setSelectedLocation(null);
        setSearchError(error || "По запросу ничего не найдено.");
      }
    } catch {
      setSearchError("Ошибка при поиске.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          setMapCenter(coords);
          setZoom(15);
          toast.success("Ваше местоположение определено");
        },
        () => {
          toast.error("Не удалось определить геопозицию");
        }
      );
    }
  };

  const handleBuildRoute = async () => {
    if (!selectedLocation) return;

    let origin = userLocation;
    if (!origin) {
      toast.info("Определение вашего местоположения...");
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const uCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setUserLocation(uCoords);
            await calculateRoute(uCoords, [selectedLocation.latitude, selectedLocation.longitude]);
          },
          () => toast.error("Включите геолокацию для маршрута")
        );
      }
      return;
    }

    await calculateRoute(origin, [selectedLocation.latitude, selectedLocation.longitude]);
  };

  const calculateRoute = async (from: [number, number], to: [number, number]) => {
    setBuildingRoute(true);
    try {
      const detail = await hybridMapSearch.buildRoute({ from, to, mode: "driving" });
      if (detail) {
        setRouteInfo(detail);
        toast.success("Маршрут построен!");
      }
    } catch {
      toast.error("Ошибка при построении маршрута");
    } finally {
      setBuildingRoute(false);
    }
  };

  const handleShare = () => {
    if (!selectedLocation) return;
    const shareText = `📍 ${selectedLocation.name}\n🏠 ${selectedLocation.address}\nhttps://2gis.ru/geo/${selectedLocation.longitude},${selectedLocation.latitude}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success("Данные скопированы");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="nav.map" onMenuClick={() => setIsMenuOpen(true)} showBack />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="flex-1 p-4 space-y-3 flex flex-col relative">
        <div className="vaqta-glass p-2 border-[#1A3D2E] shadow-xl relative z-20">
          <div className="flex items-center gap-2 px-2">
            <Search size={18} className="text-[#00A86B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && executeSearch(searchQuery)}
              placeholder="Тюмень вокзал, ЕПРС..."
              className="flex-1 bg-transparent py-2.5 text-xs text-white outline-none placeholder-[#5C7A6D] font-bold"
            />
            <button
              onClick={() => executeSearch(searchQuery)}
              disabled={isSearching}
              className="bg-[#00A86B] text-white px-3.5 py-2 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : "Найти"}
            </button>
            <button
              onClick={handleLocateMe}
              className="p-2 bg-[#0C1F1A] border border-[#1A3D2E] rounded-xl text-[#00A86B]"
            >
              <Crosshair size={16} />
            </button>
          </div>
        </div>

        {searchError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="vaqta-glass p-3 border-amber-500/30 text-xs text-amber-200 font-bold z-20 flex justify-between items-center">
            <span>{searchError}</span>
            <button onClick={() => executeSearch(searchQuery)}><RefreshCw size={14}/></button>
          </motion.div>
        )}

        {searchResults.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 text-xs z-20">
            {searchResults.map((res, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedLocation(res);
                  setMapCenter([res.latitude, res.longitude]);
                }}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap text-[11px] font-bold transition-all ${
                  selectedLocation?.name === res.name
                    ? "bg-[#00A86B] border-[#00D4A8] text-white shadow-lg"
                    : "bg-[#0C1F1A] border-[#1A3D2E] text-slate-300"
                }`}
              >
                📍 {res.name}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-1 min-h-[380px] rounded-[2rem] overflow-hidden border border-[#1A3D2E] shadow-2xl z-10">
          <Map
            center={mapCenter}
            zoom={zoom}
            markers={selectedLocation ? [{
              id: selectedLocation.name,
              title: selectedLocation.name,
              coordinates: [selectedLocation.latitude, selectedLocation.longitude]
            }] : []}
            userLocation={userLocation}
            autoOpenPopup={true}
            className="w-full h-full rounded-[2rem]"
          />
        </div>

        <AnimatePresence mode="wait">
          {selectedLocation && (
            <motion.div key={selectedLocation.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="vaqta-glass p-5 border-[#00A86B]/30 space-y-3 shadow-2xl z-20">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                   <p className="text-[9px] font-black uppercase tracking-widest text-[#00A86B]">2ГИС ПРОВАЙДЕР • SCORE: {selectedLocation.score}</p>
                   <h3 className="font-extrabold text-base leading-snug text-[#00D4A8] truncate">{selectedLocation.name}</h3>
                   <p className="text-xs text-slate-300 font-medium truncate">{selectedLocation.address}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setIsFavorite(!isFavorite)} className={`p-2.5 rounded-xl border ${isFavorite ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]" : "bg-white/5 border-white/10 text-slate-400"}`}><Star size={16} fill={isFavorite ? "#D4AF37" : "none"} /></button>
                  <button onClick={handleShare} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400">{copied ? <Check size={16} className="text-[#00A86B]" /> : <Share2 size={16} />}</button>
                </div>
              </div>

              {routeInfo && (
                <div className="p-2.5 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-xl flex items-center justify-between text-xs text-[#00A86B] font-bold">
                  <span>{(routeInfo.distanceMeters / 1000).toFixed(1)} км</span>
                  <span>~{Math.round(routeInfo.durationSeconds / 60)} мин</span>
                </div>
              )}

              <button onClick={handleBuildRoute} disabled={buildingRoute} className="w-full h-12 vaqta-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl vaqta-glow disabled:opacity-50">
                {buildingRoute ? <Loader2 size={16} className="animate-spin" /> : <><Navigation size={16} /> Построить маршрут</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}