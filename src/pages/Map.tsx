"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Navigation, MapPin, ShieldCheck, Star, 
  ExternalLink, Crosshair, Briefcase, RefreshCw, AlertCircle 
} from "lucide-react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Map as OsmMap, VacancyMarkerData } from "@/components/Map";
import { geocodingService } from "@/services/geocodingService";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageProvider";

const SAMPLE_VACANCIES: VacancyMarkerData[] = [
  {
    id: "v1",
    title: "Сварщик НАКС (Вахта)",
    salary: "180 000 ₽",
    city: "Ташкент",
    address: "улица Амира Темура, 107, Ташкент",
    coordinates: [69.2831, 41.3322],
    type: "premium",
    employerName: "ООО 'ПромСтройМонтаж'",
    schedule: "Вахта 30/30 • Проживание + Питание",
    url: "https://hh.ru",
  },
  {
    id: "v2",
    title: "Водитель категории C, E",
    salary: "150 000 ₽",
    city: "Ташкент",
    address: "Проспект Ислама Каримова, 43, Ташкент",
    coordinates: [69.2605, 41.3111],
    type: "verified",
    employerName: "Логистика Узбекистан",
    schedule: "Сменный график 15/15",
    url: "https://hh.ru",
  },
  {
    id: "v3",
    title: "Разнорабочий на производство",
    salary: "95 000 ₽",
    city: "Ташкент",
    address: "улица Бабура, 55, Ташкент",
    coordinates: [69.2488, 41.2825],
    type: "employer",
    employerName: "ИП Диев Д.С.",
    schedule: "Полный день • Предоставляется жильё",
    url: "https://hh.ru",
  },
];

export default function MapPage() {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>([69.2401, 41.2995]);
  const [zoom, setZoom] = useState(12);
  const [selectedVacancy, setSelectedVacancy] = useState<VacancyMarkerData | null>(SAMPLE_VACANCIES[0]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const handleAddressSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await geocodingService.searchAddressFull(searchQuery);

      if (res.isTooShort) {
        setSearchError("Введите полный адрес:\nгород + улица + дом");
        toast.warning("Введите полный адрес (напр. Москва, Ленина 25)");
        return;
      }

      if (res.results && res.results.length > 0) {
        const first = res.results[0];
        setCenter([first.longitude, first.latitude]);
        setZoom(14);
        setSearchError(null);
        toast.success(`Найдено: ${first.display_name.slice(0, 45)}...`);
      } else {
        const msg = res.error || "Не удалось найти адрес. Уточните город или улицу.";
        setSearchError(msg);
        toast.error("Адрес не найден");
      }
    } catch {
      setSearchError("Не удалось найти адрес. Уточните город или улицу.");
      toast.error("Ошибка при поиске адреса.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateUser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setUserLocation(coords);
          setCenter(coords);
          setZoom(14);
          toast.success("Ваше местоположение определено");
        },
        (err) => {
          console.warn("Geolocation error:", err);
          toast.error("Не удалось определить геопозицию");
        }
      );
    } else {
      toast.error("Геолокация не поддерживается вашим браузером");
    }
  };

  const buildRoute = useCallback((coords: [number, number]) => {
    const [lng, lat] = coords;
    const url = `https://www.google.com/maps/?rtext=~${lat},${lng}&rtt=auto`;
    window.open(url, "_blank");
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.map" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="px-4 mt-2 flex-1 space-y-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>🗺️</span> Карта вакансий
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
              OpenStreetMap • Поиск адресов и вакансий
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchError) setSearchError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
              placeholder="Введите адрес (напр. Москва, Ленинский проспект 25)..."
              className="flex-1 bg-transparent py-3 text-xs outline-none placeholder-[#5C7A6D] font-bold text-white"
            />
            <button
              onClick={handleAddressSearch}
              disabled={isSearching}
              className="bg-[#00A86B] px-4 py-2.5 rounded-xl text-xs font-black text-white hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isSearching ? "Поиск..." : "Найти"}
            </button>
          </div>
        </div>

        {searchError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="vaqta-glass p-4 border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-200 whitespace-pre-line">
              <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
            <button
              onClick={handleAddressSearch}
              className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-amber-500/30 transition-colors flex-shrink-0"
            >
              <RefreshCw size={12} />
              <span>Попробовать снова</span>
            </button>
          </motion.div>
        )}

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 text-[10px] font-black uppercase tracking-wider">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0C1F1A] border border-[#1A3D2E] text-slate-300">
            <span>🔴</span> <span>Работодатель</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0C1F1A] border border-[#00A86B]/30 text-[#00A86B]">
            <span>🟢</span> <span>Проверенный</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0C1F1A] border border-[#D4AF37]/30 text-[#D4AF37]">
            <span>⭐</span> <span>Премиум</span>
          </div>
        </div>

        <div className="relative flex-1 min-h-[360px] md:min-h-[450px]">
          <OsmMap
            center={center}
            zoom={zoom}
            markers={SAMPLE_VACANCIES}
            selectedMarkerId={selectedVacancy?.id ?? null}
            onSelectMarker={(v) => {
              setSelectedVacancy(v as VacancyMarkerData);
              setCenter(v.coordinates);
            }}
            userLocation={userLocation}
            className="w-full h-full rounded-[2.5rem]"
          />
        </div>

        <AnimatePresence mode="wait">
          {selectedVacancy && (
            <motion.div
              key={selectedVacancy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="vaqta-glass p-6 border-[#00A86B]/30 space-y-4 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">
                      {selectedVacancy.type === "premium"
                        ? "⭐"
                        : selectedVacancy.type === "verified"
                        ? "🟢"
                        : "🔴"}
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
                      {selectedVacancy.employerName}
                    </p>
                  </div>
                  <h3 className="font-extrabold text-base leading-tight text-white">
                    {selectedVacancy.title}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[#00A86B]">{selectedVacancy.salary}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#00A86B] flex-shrink-0" />
                  <span className="truncate">{selectedVacancy.address}</span>
                </div>
                {selectedVacancy.schedule && (
                  <div className="flex items-center gap-2 text-[#5C7A6D]">
                    <Briefcase size={14} className="flex-shrink-0" />
                    <span>{selectedVacancy.schedule}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => selectedVacancy.url && window.open(selectedVacancy.url, "_blank")}
                  className="h-12 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#00A86B] hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <ExternalLink size={14} />
                  <span>Открыть вакансию</span>
                </button>

                <button
                  onClick={() => buildRoute(selectedVacancy.coordinates)}
                  className="h-12 vaqta-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg vaqta-glow"
                >
                  <Navigation size={14} />
                  <span>Построить маршрут</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}