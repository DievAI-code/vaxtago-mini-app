"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Crosshair, Navigation, Loader2, MapPin, 
  ArrowRightLeft, AlertCircle, RefreshCw, Mic, MicOff,
  Footprints, Car
} from "lucide-react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Map } from "@/components/Map";
import { geocodingService, GeocodingResult } from "@/services/geocodingService";
import { routeService, RouteResult, TravelMode } from "@/services/maps/routeService";
import { detectNavigationIntent } from "@/services/aiCommands";
import { RoutePanel } from "@/components/maps/RoutePanel";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { toast } from "sonner";

export default function Maps() {
  const [searchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  // Locations
  const [origin, setOrigin] = useState<GeocodingResult | null>(null);
  const [destination, setDestination] = useState<GeocodingResult | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  
  // Navigation State
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [mode, setMode] = useState<TravelMode>("car");
  const [loading, setLoading] = useState(false);

  const handleLocateMe = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(coords);
        setOrigin({
          latitude: coords[0],
          longitude: coords[1],
          display_name: "Моё местоположение",
          name: "Моё местоположение"
        });
      });
    }
  }, []);

  const calculateRoute = async (from: GeocodingResult, to: GeocodingResult, travelMode: TravelMode) => {
    setLoading(true);
    try {
      const res = await routeService.buildRoute(
        [from.latitude, from.longitude],
        [to.latitude, to.longitude],
        travelMode
      );
      if (res) setRoute(res);
      else toast.error("Не удалось построить маршрут");
    } finally {
      setLoading(false);
    }
  };

  const executeCommand = async (text: string) => {
    setSearchQuery(text);
    const intent = detectNavigationIntent(text);
    
    if (intent.intent === "route") {
      setLoading(true);
      try {
        // 1. Resolve Destination
        const toResults = await geocodingService.searchAddress(intent.to || "");
        if (toResults.length === 0) return toast.error("Место назначения не найдено");
        const to = toResults[0];
        setDestination(to);

        // 2. Resolve Origin
        let from = origin;
        if (intent.from) {
          const fromResults = await geocodingService.searchAddress(intent.from);
          if (fromResults.length > 0) from = fromResults[0];
        } else if (!userCoords) {
           handleLocateMe(); // try getting GPS
        }
        
        if (from) {
          setOrigin(from);
          await calculateRoute(from, to, (intent.mode as TravelMode) || "car");
          setMode((intent.mode as TravelMode) || "car");
        } else {
          toast.info("Нажмите кнопку геолокации, чтобы построить маршрут от вас");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // General search
      const results = await geocodingService.searchAddress(text);
      if (results.length > 0) {
        setDestination(results[0]);
        setRoute(null);
      }
    }
  };

  const { isListening, toggleListening } = useVoiceAssistant(executeCommand);

  useEffect(() => {
    if (searchParams.get("search")) executeCommand(searchParams.get("search")!);
    handleLocateMe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="nav.map" onMenuClick={() => setIsMenuOpen(true)} showBack />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="flex-1 p-4 space-y-4 flex flex-col relative">
        {/* Smart AI Input */}
        <div className="vaqta-glass p-2 border-[#1A3D2E] shadow-xl relative z-20">
          <div className="flex items-center gap-2 px-2">
            <button onClick={toggleListening} className={`p-2 rounded-xl transition-all ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-[#06140F] text-[#00A86B]"}`}>
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && executeCommand(searchQuery)}
              placeholder="Куда едем? (напр: от вокзала до ЕПРС)"
              className="flex-1 bg-transparent py-2.5 text-xs text-white outline-none font-bold"
            />
            <button onClick={() => executeCommand(searchQuery)} className="bg-[#00A86B] text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg">
              {loading ? <Loader2 className="animate-spin" size={14} /> : "Путь"}
            </button>
          </div>
        </div>

        {/* Map Engine */}
        <div className="relative flex-1 min-h-[350px] rounded-[2.5rem] overflow-hidden border border-[#1A3D2E] shadow-2xl z-10">
          <Map
            center={destination ? [destination.latitude, destination.longitude] : [41.2995, 69.2401]}
            zoom={route ? 12 : 14}
            markers={destination ? [{
              id: "dest",
              title: destination.name || destination.display_name,
              coordinates: [destination.latitude, destination.longitude]
            }] : []}
            userLocation={userCoords}
          />
          <button onClick={handleLocateMe} className="absolute bottom-6 right-6 p-4 bg-[#06140F]/90 backdrop-blur-xl border border-white/10 rounded-2xl text-[#00A86B] shadow-2xl active:scale-95 transition-all z-[1000]">
            <Crosshair size={22} />
          </button>
        </div>

        {/* Route Panel Overlay */}
        <AnimatePresence mode="wait">
          {route && origin && destination ? (
            <RoutePanel 
              route={route} 
              mode={mode} 
              fromName={origin.name || "Место отправления"}
              toName={destination.name || "Пункт назначения"}
              onModeChange={(m) => { setMode(m); calculateRoute(origin!, destination!, m); }}
              onStart={() => toast.success("Маршрут запущен! Следуйте инструкциям.")}
            />
          ) : destination && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="vaqta-glass p-5 border-[#00A86B]/30 space-y-3">
              <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-[#00A86B]">Пункт назначения</p>
                 <h3 className="font-extrabold text-base leading-snug text-white">{destination.name || destination.display_name.split(',')[0]}</h3>
                 <p className="text-xs text-slate-300 font-medium truncate">{destination.address || destination.display_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => { setMode("walking"); calculateRoute(origin || { latitude: userCoords![0], longitude: userCoords![1], display_name: "Я", name: "Я" }, destination, "walking"); }} className="h-12 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2"><Footprints size={14} /> Пешком</button>
                 <button onClick={() => { setMode("car"); calculateRoute(origin || { latitude: userCoords![0], longitude: userCoords![1], display_name: "Я", name: "Я" }, destination, "car"); }} className="h-12 vaqta-gradient rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2"><Car size={14} /> На машине</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}