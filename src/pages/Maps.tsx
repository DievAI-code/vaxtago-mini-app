"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Crosshair, Navigation, Share2, Star, Loader2,
  AlertCircle, RefreshCw, Check, MapPin, ArrowRight
} from "lucide-react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Map } from "@/components/Map";
import { geocodingService, GeocodingResult } from "@/services/geocodingService";
import { routeService, RouteResult, TravelMode } from "@/services/maps/routeService";
import { RoutePanel } from "@/components/maps/RoutePanel";
import { subscription } from "@/services/subscription";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageProvider";

export default function Maps() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Routing State
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [isRouting, setIsRouting] = useState(false);

  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("query");
    if (q) {
      setSearchQuery(q);
      executeSearch(q);
    }
    handleLocateMe();
  }, [searchParams]);

  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    setRouteInfo(null);

    try {
      const { results } = await geocodingService.searchAddressFull(queryText);
      if (results.length > 0) {
        setSelectedLocation(results[0]);
        toast.success(`Найдено: ${results[0].name}`);
      } else {
        toast.error("Объект не найден");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  };

  const buildRoute = async (mode: TravelMode = travelMode) => {
    if (!selectedLocation || !userLocation) {
      if (!userLocation) toast.error("Включите геолокацию");
      return;
    }

    setIsRouting(true);
    setTravelMode(mode);
    
    try {
      const res = await routeService.getRoute(
        userLocation, 
        [selectedLocation.latitude, selectedLocation.longitude],
        mode
      );
      if (res) {
        setRouteInfo(res);
      } else {
        toast.error("Не удалось построить путь");
      }
    } finally {
      setIsRouting(false);
    }
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
              placeholder="Куда едем? (напр: ЕПРС Тюмень)"
              className="flex-1 bg-transparent py-2.5 text-xs text-white outline-none font-bold"
            />
            <button onClick={() => executeSearch(searchQuery)} className="bg-[#00A86B] text-white px-4 py-2 rounded-xl text-xs font-black">
              {isSearching ? <Loader2 className="animate-spin" size={14} /> : "Найти"}
            </button>
          </div>
        </div>

        <div className="relative flex-1 min-h-[380px] rounded-[2rem] overflow-hidden border border-[#1A3D2E] shadow-2xl z-10">
          <Map
            center={selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : [41.2995, 69.2401]}
            zoom={14}
            markers={selectedLocation ? [{
              id: selectedLocation.name,
              title: selectedLocation.name,
              coordinates: [selectedLocation.latitude, selectedLocation.longitude]
            }] : []}
            userLocation={userLocation}
          />
        </div>

        <AnimatePresence mode="wait">
          {routeInfo ? (
            <RoutePanel 
              route={routeInfo} 
              mode={travelMode} 
              onModeChange={(m) => buildRoute(m)} 
              onClose={() => setRouteInfo(null)}
            />
          ) : selectedLocation && (
            <motion.div key="loc" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="vaqta-glass p-5 border-[#00A86B]/30 space-y-3">
              <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-[#00A86B]">Выбранный объект</p>
                 <h3 className="font-extrabold text-base leading-snug text-white">{selectedLocation.name}</h3>
                 <p className="text-xs text-slate-300 font-medium truncate">{selectedLocation.address}</p>
              </div>
              <button onClick={() => buildRoute()} disabled={isRouting} className="w-full h-14 vaqta-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl vaqta-glow">
                {isRouting ? <Loader2 size={16} className="animate-spin" /> : <><Navigation size={16} /> Построить маршрут</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}