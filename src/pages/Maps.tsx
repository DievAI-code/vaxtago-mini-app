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
import { hybridMapSearch, MapSearchResult, RouteDetail } from "@/services/maps/search";
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
  const [isLowConfidence, setIsLowConfidence] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<MapSearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MapSearchResult | null>(null);
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
    setNoticeMessage(null);
    setRouteInfo(null);
    setIsLowConfidence(false);

    try {
      const { results, isLowConfidence: lowConf, message } = await hybridMapSearch.searchLocation(queryText);
      await subscription.trackUsage("maps");

      if (results.length > 0) {
        setSearchResults(results);
        setIsLowConfidence(lowConf);
        setNoticeMessage(message || null);
        const top = results[0];
        setSelectedLocation(top);
        setMapCenter([top.latitude, top.longitude]);
        setZoom(14);
        toast.success(`Найдено: ${top.title}`);
      } else {
        setSearchResults([]);
        setSelectedLocation(null);
        setSearchError(message || "По запросу ничего не найдено.");
      }
    } catch {
      setSearchError("По запросу ничего не найдено.");
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
    } else {
      toast.error("Геолокация не поддерживается вашим браузером");
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
          () => toast.error("Включите геолокацию на устройстве для построения маршрута")
        );
      }
      return;
    }

    await calculateRoute(origin, [selectedLocation.latitude, selectedLocation.longitude]);
  };

  const calculateRoute = async (from: [number, number], to: [number, number]) => {
    setBuildingRoute(true);
    try {
      const detail = await hybridMapSearch.buildRoute({
        from,
        to,
        mode: "driving",
      });

      if (detail) {
        setRouteInfo(detail);
        toast.success("Маршрут успешно построен!");
      }
    } catch {
      toast.error("Ошибка при построении маршрута");
    } finally {
      setBuildingRoute(false);
    }
  };

  const handleShare = () => {
    if (!selectedLocation) return;
    const shareText = `📍 ${selectedLocation.title}\n🏠 ${selectedLocation.address}\nhttps://2gis.ru/geo/${selectedLocation.longitude},${selectedLocation.latitude}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success("Ссылка и адрес скопированы");
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchError) setSearchError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && executeSearch(searchQuery)}
              placeholder="Тюмень жд вокзал, tyumen vokzal..."
              className="flex-1 bg-transparent py-2.5 text-xs text-white outline-none placeholder-[#5C7A6D] font-bold"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setSelectedLocation(null);
                  setSearchError(null);
                  setNoticeMessage(null);
                  setIsLowConfidence(false);
                }}
                className="text-xs text-[#5C7A6D] hover:text-white px-1"
              >
                Очистить
              </button>
            )}
            <button
              onClick={() => executeSearch(searchQuery)}
              disabled={isSearching}
              className="bg-[#00A86B] text-white px-3.5 py-2 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : "Найти"}
            </button>
            <button
              onClick={handleLocateMe}
              className="p-2 bg-[#0C1F1A] border border-[#1A3D2E] rounded-xl text-[#00A86B] hover:scale-105 transition-all"
              title="Мое местоположение"
            >
              <Crosshair size={16} />
            </button>
          </div>
        </div>

        {/* Notice Message when exact city match was missing */}
        {noticeMessage && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="vaqta-glass p-3 border-amber-500/30 bg-amber-500/10 rounded-2xl z-20 space-y-2"
          >
            <p className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
              <span>{noticeMessage}</span>
            </p>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {searchResults.slice(0, 4).map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedLocation(res);
                    setMapCenter([res.latitude, res.longitude]);
                    setZoom(15);
                    setNoticeMessage(null);
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between border ${
                    selectedLocation?.title === res.title
                      ? "bg-[#00A86B] border-[#00D4A8] text-white"
                      : "bg-[#06140F]/80 border-[#1A3D2E] text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-extrabold">{res.title}</p>
                    <p className="text-[10px] text-[#5C7A6D] truncate">{res.address}</p>
                  </div>
                  <MapPin size={14} className="flex-shrink-0 text-[#00A86B]" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Low Confidence Choice Banner */}
        {isLowConfidence && !noticeMessage && searchResults.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="vaqta-glass p-3 border-[#00A86B]/30 bg-[#00A86B]/10 rounded-2xl z-20 space-y-2"
          >
            <p className="text-xs font-bold text-[#00D4A8]">
              Я нашёл несколько вариантов. Выберите:
            </p>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {searchResults.slice(0, 4).map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedLocation(res);
                    setMapCenter([res.latitude, res.longitude]);
                    setZoom(15);
                    setIsLowConfidence(false);
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between border ${
                    selectedLocation?.title === res.title
                      ? "bg-[#00A86B] border-[#00D4A8] text-white"
                      : "bg-[#06140F]/80 border-[#1A3D2E] text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-extrabold">{res.title}</p>
                    <p className="text-[10px] text-[#5C7A6D] truncate">{res.address}</p>
                  </div>
                  <MapPin size={14} className="flex-shrink-0 text-[#00A86B]" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {searchError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="vaqta-glass p-3.5 border-amber-500/30 bg-amber-500/10 flex items-center justify-between text-xs text-amber-200 font-bold z-20"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
            <button
              onClick={() => executeSearch(searchQuery)}
              className="p-1 text-amber-300 hover:text-white"
            >
              <RefreshCw size={14} />
            </button>
          </motion.div>
        )}

        {searchResults.length > 1 && !isLowConfidence && !noticeMessage && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 text-xs z-20">
            {searchResults.map((res, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedLocation(res);
                  setMapCenter([res.latitude, res.longitude]);
                  setZoom(15);
                }}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap text-[11px] font-bold transition-all ${
                  selectedLocation?.title === res.title
                    ? "bg-[#00A86B] border-[#00D4A8] text-white shadow-lg"
                    : "bg-[#0C1F1A] border-[#1A3D2E] text-slate-300"
                }`}
              >
                📍 {res.title}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-1 min-h-[380px] rounded-[2rem] overflow-hidden border border-[#1A3D2E] shadow-2xl z-10">
          <Map
            center={mapCenter}
            zoom={zoom}
            markers={
              selectedLocation
                ? [
                    {
                      id: "selected-loc",
                      title: selectedLocation.title,
                      coordinates: [selectedLocation.latitude, selectedLocation.longitude],
                    },
                  ]
                : []
            }
            userLocation={userLocation}
            autoOpenPopup={true}
            className="w-full h-full rounded-[2rem]"
          />
        </div>

        <AnimatePresence mode="wait">
          {selectedLocation && (
            <motion.div
              key={selectedLocation.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="vaqta-glass p-5 border-[#00A86B]/30 space-y-3 shadow-2xl z-20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">📍</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#00A86B]">
                      2ГИС
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base leading-snug text-[#00D4A8] truncate">
                    {selectedLocation.title}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium truncate">
                    {selectedLocation.address}
                  </p>
                </div>

                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      isFavorite
                        ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Star size={16} fill={isFavorite ? "#D4AF37" : "none"} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check size={16} className="text-[#00A86B]" /> : <Share2 size={16} />}
                  </button>
                </div>
              </div>

              {routeInfo && (
                <div className="p-2.5 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-xl flex items-center justify-between text-xs text-[#00A86B] font-bold">
                  <span>{(routeInfo.distanceMeters / 1000).toFixed(1)} км</span>
                  <span>~{Math.round(routeInfo.durationSeconds / 60)} мин</span>
                </div>
              )}

              <button
                onClick={handleBuildRoute}
                disabled={buildingRoute}
                className="w-full h-12 vaqta-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg vaqta-glow active:scale-95 transition-transform disabled:opacity-50"
              >
                {buildingRoute ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Navigation size={16} /> Построить маршрут
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}