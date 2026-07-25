"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { 
  Search, Navigation, Crosshair, MapPin, X, 
  Car, Footprints, Bus, Clock, Ruler, Loader2
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { mapsService, TravelMode } from "@/services/maps/mapsService";
import { saveMapState, loadMapState } from "@/lib/appStorage";
import { navigationService, NavigationProvider } from "@/services/navigation";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";

const containerStyle: React.CSSProperties = {
  height: "100dvh",
  minHeight: "100dvh",
  maxHeight: "100dvh",
};

export default function MapPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [center, setCenter] = useState<[number, number]>([55.7558, 37.6173]);
  const [zoom, setZoom] = useState(12);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedDest, setSelectedDest] = useState<any>(null);
  const [routeMode, setRouteMode] = useState<TravelMode>("car");
  const [routeInfo, setRouteInfo] = useState<{ dist: string; time: string } | null>(null);
  const [isBuildingRoute, setIsBuildingRoute] = useState(false);

  useEffect(() => {
    const handleRestore = (e: Event) => {
      const customEvent = e as CustomEvent;
      const restoredState = customEvent.detail?.state;
      if (restoredState?.mapCenter) {
        setCenter(restoredState.mapCenter);
        if (restoredState.mapZoom) setZoom(restoredState.mapZoom);
        toast.success("🗺 Карта восстановлена");
      }
    };
    window.addEventListener("vaqta:state-restored", handleRestore);
    return () => window.removeEventListener("vaqta:state-restored", handleRestore);
  }, []);

  useEffect(() => {
    const initMap = async () => {
      if (!mapContainerRef.current) return;
      const savedState = loadMapState();
      if (savedState) {
        setCenter(savedState.center);
        setZoom(savedState.zoom);
      }
      setIsLoading(false);
    };
    initMap();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveMapState({
        center,
        zoom,
        lastRoute: routeInfo
          ? { from: selectedDest?.name || "", to: selectedDest?.name || "", mode: routeMode }
          : undefined,
      });
    }
  }, [center, zoom, routeInfo, routeMode, isLoading, selectedDest]);

  const handleRouteSearch = async (from?: string, to?: string, mode: TravelMode = "car") => {
    if (!to) return;
    setIsBuildingRoute(true);
    setRouteMode(mode);

    try {
      const result = await mapsService.buildRoute({
        from: from || userLocation || "Москва",
        to,
        mode,
      });

      if (result) {
        setRouteInfo({ dist: result.distance, time: result.duration });
        if (result.geometry.length > 0) {
          const bounds = result.geometry;
          const midIndex = Math.floor(bounds.length / 2);
          setCenter(bounds[midIndex]);
        }
        toast.success("Маршрут построен!");
      }
    } catch (error) {
      toast.error("Не удалось построить маршрут");
    } finally {
      setIsBuildingRoute(false);
    }
  };

  const handleAddressSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await mapsService.searchAddress(searchQuery);
      if (results.length > 0) {
        const first = results[0];
        setSelectedDest(first);
        setCenter([first.latitude, first.longitude]);
        setZoom(15);
        toast.success("Адрес найден");
      } else {
        toast.error("Адрес не найден");
      }
    } catch (error) {
      toast.error("Ошибка поиска");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateUser = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Геолокация не поддерживается");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(coords);
        setCenter(coords);
        setZoom(14);
        toast.success("Местоположение определено");
      },
      () => {
        toast.error("Не удалось определить местоположение");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleProviderSelect = (provider: NavigationProvider) => {
    if (!selectedDest) return;
    const fromLabel = userLocation ? "Моё местоположение" : "Москва";
    navigationService.openRoute(provider, {
      from: fromLabel,
      to: selectedDest.name || selectedDest.display_name,
      mode: routeMode,
    });
  };

  const routeLinks = selectedDest
    ? navigationService.buildRoute({
        from: userLocation ? "Моё местоположение" : "Москва",
        to: selectedDest.name || selectedDest.display_name,
        mode: routeMode,
      })
    : [];

  const MODES: { id: TravelMode; icon: any; label: string }[] = [
    { id: "car", icon: Car, label: t("maps.car") || "Авто" },
    { id: "walking", icon: Footprints, label: t("maps.walking") || "Пешком" },
    { id: "transit", icon: Bus, label: t("maps.transit") || "Транспорт" },
  ];

  return (
    <div className="flex flex-col bg-[#06140F] text-white overflow-hidden" style={containerStyle}>
      <Header title={t("nav.map") || "Карта"} showBack />

      <div className="flex-1 relative">
        <div
          ref={mapContainerRef}
          className="absolute inset-0 bg-[#0C1F1A]"
          style={{ minHeight: "100%" }}
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#06140F] z-50">
            <div className="text-center space-y-3">
              <Loader2 className="animate-spin text-[#00A86B] mx-auto" size={32} />
              <p className="text-xs font-black uppercase text-[#5C7A6D]">Загрузка карты...</p>
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 right-4 z-10 space-y-3">
          <div className="vaqta-glass p-2 flex items-center gap-2">
            <Search size={18} className="text-[#00A86B] ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
              placeholder={t("maps.search_placeholder") || "Поиск адреса..."}
              className="flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder-[#5C7A6D]"
            />
            {isSearching ? (
              <Loader2 className="animate-spin text-[#00A86B] mr-2" size={18} />
            ) : (
              <button
                onClick={handleAddressSearch}
                className="bg-[#00A86B] px-4 py-2 rounded-lg text-xs font-black text-white mr-1"
              >
                {t("common.search") || "Поиск"}
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = routeMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setRouteMode(m.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${
                    active
                      ? "bg-[#00A86B] text-white"
                      : "bg-[#06140F]/80 backdrop-blur text-[#5C7A6D]"
                  }`}
                >
                  <Icon size={14} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleLocateUser}
          className="absolute bottom-24 right-4 z-10 p-3 bg-[#06140F] rounded-xl shadow-lg border border-white/10 text-[#00A86B] active:scale-95 transition-transform"
        >
          <Crosshair size={20} />
        </button>

        <AnimatePresence>
          {selectedDest && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-20 left-4 right-4 z-10 space-y-3"
            >
              <div className="vaqta-glass border-[#00A86B]/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-[#00A86B]">
                  <Navigation size={18} />
                  <span className="text-xs font-black uppercase">Маршрут построен</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-[#D4AF37]" />
                      <div>
                        <p className="text-lg font-black text-white">{routeInfo?.time || "—"}</p>
                        <p className="text-[9px] text-[#5C7A6D] uppercase">Время</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <Ruler size={16} className="text-[#00A86B]" />
                      <div>
                        <p className="text-lg font-black text-white">{routeInfo?.dist || "—"}</p>
                        <p className="text-[9px] text-[#5C7A6D] uppercase">Расстояние</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="vaqta-glass border-[#00A86B]/30 p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
                  🗺 Открыть маршрут в навигаторе
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}