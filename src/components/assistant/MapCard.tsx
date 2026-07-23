"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Compass, Loader2, AlertCircle, Clock, Route } from "lucide-react";
import { YandexMap } from "../maps/YandexMap";
import { useLanguage } from "@/context/LanguageProvider";
import { locationService, LocationResult, RouteResult } from "@/services/locationService";
import { toast } from "sonner";

interface MapCardProps {
  query?: string;
  type?: "search" | "route" | "nearby";
  onActionComplete?: () => void;
}

export function MapCard({ query, type = "search", onActionComplete }: MapCardProps) {
  const { t } = useLanguage();
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    initLocationData();
  }, [query]);

  const initLocationData = async () => {
    setLoading(true);
    setError(false);

    try {
      if (query) {
        const res = await locationService.searchLocation(query);
        if (res) {
          setLocation(res);
        } else {
          // Fallback location for known default
          setLocation({
            name: query,
            address: query,
            latitude: 57.153, // Tyumen default lat if not found
            longitude: 65.534, // Tyumen default lng
          });
        }
      }

      // Try user location
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords([pos.coords.latitude, pos.coords.longitude]);
          },
          () => {}
        );
      }
    } catch (err) {
      console.warn("MapCard location error:", err);
      setError(true);
    } finally {
      setLoading(false);
      onActionComplete?.();
    }
  };

  const handleBuildRoute = async () => {
    if (!location) return;

    if (!userCoords) {
      toast.info("Запрашиваем ваше местоположение...");
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const uCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setUserCoords(uCoords);
            const r = await locationService.buildRoute(uCoords, [location.latitude, location.longitude]);
            if (r) {
              setRoute(r);
              toast.success("Маршрут построен!");
            }
          },
          () => toast.error("Не удалось определить ваше местоположение")
        );
      }
      return;
    }

    const r = await locationService.buildRoute(userCoords, [location.latitude, location.longitude]);
    if (r) {
      setRoute(r);
      toast.success("Маршрут построен!");
    } else {
      toast.info("Маршрут сформирован по прямым координатам");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-36 vaqta-glass flex flex-col items-center justify-center border-[#1A3D2E] gap-2">
        <Loader2 className="animate-spin text-[#00A86B]" size={22} />
        <span className="text-[10px] font-black uppercase text-[#5C7A6D]">Загрузка карты VAQTA AI...</span>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="w-full p-4 vaqta-glass border-amber-500/30 bg-amber-500/5 rounded-2xl flex items-center gap-3 text-amber-200 text-xs font-bold my-2">
        <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
        <p>Сейчас не удалось загрузить карту. Попробуйте позже.</p>
      </div>
    );
  }

  const mapCenter: [number, number] = [location.longitude, location.latitude];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full vaqta-glass overflow-hidden border-[#00A86B]/30 shadow-2xl my-2"
    >
      <div className="h-44 relative">
        <YandexMap
          center={mapCenter}
          zoom={14}
          markers={[
            {
              id: "target",
              title: location.name,
              salary: "",
              city: "",
              address: location.address,
              coordinates: mapCenter,
              type: "verified",
              employerName: location.name,
            },
          ]}
          userLocation={userCoords ? [userCoords[1], userCoords[0]] : null}
          className="w-full h-full rounded-none"
        />

        <div className="absolute top-3 left-3 bg-[#06140F]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 max-w-[85%] shadow-lg">
          <MapPin size={14} className="text-[#00A86B] flex-shrink-0" />
          <span className="text-[10px] font-black uppercase text-white truncate">
            {location.name}
          </span>
        </div>
      </div>

      <div className="p-4 bg-[#0C1F1A] border-t border-[#1A3D2E] space-y-3">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-white leading-tight">{location.name}</p>
          <p className="text-[10px] text-[#5C7A6D] font-medium truncate">{location.address}</p>
        </div>

        {route && (
          <div className="p-2.5 bg-[#00A86B]/10 border border-[#00A86B]/30 rounded-xl flex items-center justify-between text-xs text-[#00A86B] font-bold">
            <div className="flex items-center gap-2">
              <Route size={16} />
              <span>{(route.distanceMeters / 1000).toFixed(1)} км</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock size={14} />
              <span>{Math.round(route.durationSeconds / 60)} мин</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleBuildRoute}
            className="h-10 vaqta-gradient rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-white shadow-lg vaqta-glow"
          >
            <Navigation size={14} /> Построить маршрут
          </button>

          <button
            onClick={() => toast.info("Поиск ближайших объектов активен")}
            className="h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-200 hover:bg-white/10"
          >
            <Compass size={14} className="text-[#00A86B]" /> Показать рядом
          </button>
        </div>
      </div>
    </motion.div>
  );
}