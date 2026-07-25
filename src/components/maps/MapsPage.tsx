"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Map } from "@/components/Map";
import { 
  Search, Navigation, Crosshair, MapPin, Bus, Car, 
  Accessibility, Bike, Home, Briefcase, Train, Plane,
  Hospital, Hotel, Loader2, Clock, X, Bookmark
} from "lucide-react";
import { geocodingService } from "@/services/geocodingService";
import { navigationService, NavigationProvider } from "@/services/navigation";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface MapsPageProps {
  initialQuery?: string;
}

export default function MapsPage({ initialQuery }: MapsPageProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialQuery || "");
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<[number, number]>([41.2995, 69.2401]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [travelMode, setTravelMode] = useState<"car" | "walking" | "transit">("car");
  const [selectedDest, setSelectedDest] = useState<any>(null);

  const handleSearch = async (val?: string) => {
    const q = val || query;
    if (!q.trim()) return;
    setLoading(true);
    try {
      const results = await geocodingService.searchAddress(q);
      if (results.length > 0) {
        const first = results[0];
        setCoords([first.latitude, first.longitude]);
        setSelectedDest(first);
        toast.success(t("common.done") || "Адрес найден");
      } else {
        toast.error(t("maps.not_found") || "Ничего не найдено");
      }
    } catch {
      toast.error(t("common.error") || "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  };

  const handleLocateUser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const up: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(up);
          setCoords(up);
          toast.success("Ваше местоположение определено");
        },
        () => {
          toast.error("Не удалось определить координаты");
        }
      );
    }
  };

  const handleProviderSelect = (provider: NavigationProvider) => {
    if (!selectedDest) return;
    const fromLabel = userPos ? "Моё местоположение" : "Москва";
    navigationService.openRoute(provider, {
      from: fromLabel,
      to: selectedDest.name || selectedDest.display_name,
      mode: travelMode,
    });
  };

  const routeLinks = selectedDest
    ? navigationService.buildRoute({
        from: userPos ? "Моё местоположение" : "Москва",
        to: selectedDest.name || selectedDest.display_name,
        mode: travelMode,
      })
    : [];

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden relative">
      <Header title="maps.title" showBack />

      <div className="absolute inset-0 z-0 pt-16">
        <Map
          center={coords}
          zoom={15}
          userLocation={userPos}
          className="w-full h-full rounded-none"
          markers={selectedDest ? [{ id: "dest", title: selectedDest.name, coordinates: coords }] : []}
        />
      </div>

      <div className="absolute top-20 left-0 right-0 px-4 z-20 space-y-3 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md mx-auto rounded-2xl p-2.5 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-xl"
          style={{ background: "rgba(15, 23, 42, 0.95)" }}
        >
          <div className="pl-2 text-[#00A86B] flex-shrink-0">
            <Search size={22} />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={t("maps.search_ph") || "Введите адрес или место..."}
            className="flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder-[#94A3B8]"
          />
          {loading && <Loader2 className="animate-spin text-[#00A86B] flex-shrink-0" size={20} />}
          {query && !loading && (
            <button onClick={() => setQuery("")} className="p-1.5 text-slate-400">
              <X size={18} />
            </button>
          )}
          <button
            onClick={() => handleSearch()}
            className="px-4 py-2 bg-[#00A86B] text-white font-black text-xs uppercase tracking-wider rounded-xl"
          >
            Найти
          </button>
        </div>

        <div
          className="pointer-events-auto flex gap-2 overflow-x-auto no-scrollbar py-1.5 px-3 rounded-2xl max-w-md mx-auto border border-white/10 backdrop-blur-xl"
          style={{ background: "rgba(10, 15, 25, 0.88)" }}
        >
          {[
            { id: "car" as const, icon: Car, label: "Авто" },
            { id: "walking" as const, icon: Accessibility, label: "Пешком" },
            { id: "transit" as const, icon: Bus, label: "Транспорт" },
            { id: "car" as const, icon: Bike, label: "Вело" },
          ].map((m, i) => {
            const active = travelMode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={i}
                onClick={() => setTravelMode(m.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? "bg-[#00A86B] text-white shadow-md font-black scale-105"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                <Icon size={16} />
                <span className="uppercase text-[10px]">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleLocateUser}
        className="absolute top-1/2 right-4 -translate-y-1/2 w-12 h-12 rounded-full text-white flex items-center justify-center border border-white/15 backdrop-blur-xl shadow-lg active:scale-90 transition-all z-20"
        style={{ background: "rgba(10, 15, 25, 0.88)" }}
      >
        <Crosshair size={22} className="text-[#00A86B]" />
      </button>

      <AnimatePresence>
        {selectedDest && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="absolute bottom-24 left-4 right-4 z-30 max-w-md mx-auto"
          >
            <div
              className="p-5 rounded-3xl border border-white/15 shadow-2xl backdrop-blur-2xl space-y-4"
              style={{ background: "rgba(10, 15, 25, 0.95)" }}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-[#00A86B]">
                    <MapPin size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {t("maps.found_address") || "Адрес найден"}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white leading-tight">
                    {selectedDest.name || selectedDest.display_name}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 line-clamp-2">
                    {selectedDest.display_name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDest(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
                  🗺 Открыть маршрут
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {routeLinks.map((link) => (
                    <button
                      key={link.provider}
                      type="button"
                      onClick={() => handleProviderSelect(link.provider)}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 hover:border-[#00A86B]/40 hover:bg-[#00A86B]/5 transition-all active:scale-95"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        link.provider === "yandex"
                          ? "bg-[#FFCC00]/20 text-[#FFCC00]"
                          : "bg-[#00A86B]/20 text-[#00A86B]"
                      }`}>
                        {link.provider === "yandex" ? "Я" : "2"}
                      </div>
                      <span className="text-xs font-bold text-white">{link.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}