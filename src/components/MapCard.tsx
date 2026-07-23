"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, Ruler, ExternalLink, Map as MapIcon, Crosshair } from "lucide-react";
import { YandexMap } from "./maps/YandexMap";
import { useLanguage } from "@/context/LanguageProvider";
import { geocodingService } from "@/services/geocodingService";
import { toast } from "sonner";

interface MapCardProps {
  address?: string;
  targetCoords?: [number, number]; // [lng, lat]
  title?: string;
}

export function MapCard({ address, targetCoords, title }: MapCardProps) {
  const { t } = useLanguage();
  const [coords, setCoords] = useState<[number, number] | null>(targetCoords || null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(!targetCoords && !!address);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  useEffect(() => {
    if (!coords && address) {
      handleSearch(address);
    }
  }, [address]);

  const handleSearch = async (query: string) => {
    try {
      const results = await geocodingService.searchAddress(query);
      if (results.length > 0) {
        setCoords([results[0].longitude, results[0].latitude]);
      }
    } catch (e) {
      console.error("MapCard search error:", e);
    } finally {
      setLoading(false);
    }
  };

  const getMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uCoords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setUserPos(uCoords);
          // Эмуляция расчета маршрута (в реальности это делает API карт)
          setRouteInfo({ distance: "4.2 км", duration: "12 мин" });
          toast.success(t("maps.found_address"));
        },
        () => toast.error(t("common.error"))
      );
    }
  };

  if (loading) return (
    <div className="w-full h-48 vaqta-glass flex items-center justify-center border-[#1A3D2E]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A86B]" />
    </div>
  );

  if (!coords) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="w-full vaqta-glass overflow-hidden border-[#00A86B]/30 shadow-2xl my-2"
    >
      <div className="h-48 relative">
        <YandexMap 
          center={coords} 
          zoom={14} 
          markers={[{
            id: "target",
            title: title || address || "Point",
            salary: "",
            city: "",
            address: address || "",
            coordinates: coords,
            type: "verified",
            employerName: title || "Location"
          }]}
          userLocation={userPos}
          className="w-full h-full rounded-none"
        />
        
        <button 
          onClick={getMyLocation}
          className="absolute bottom-4 right-4 p-2 bg-[#0C1F1A] border border-[#1A3D2E] rounded-xl text-[#00A86B] shadow-xl z-10 active:scale-90 transition-transform"
        >
          <Crosshair size={18} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-white truncate">{title || t("maps.job_location")}</h4>
            <p className="text-[10px] text-[#5C7A6D] font-bold truncate mt-0.5">{address}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#00A86B]/10 text-[#00A86B] px-2 py-1 rounded-lg text-[9px] font-black border border-[#00A86B]/20">
            <MapPin size={10} /> GPS
          </div>
        </div>

        {routeInfo && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-2 rounded-xl flex items-center gap-2">
              <Ruler size={14} className="text-[#00A86B]" />
              <div className="min-w-0">
                <p className="text-[8px] text-[#5C7A6D] uppercase font-black">{t("maps.distance") || "Distance"}</p>
                <p className="text-xs font-bold text-white">{routeInfo.distance}</p>
              </div>
            </div>
            <div className="bg-white/5 p-2 rounded-xl flex items-center gap-2">
              <Clock size={14} className="text-[#D4AF37]" />
              <div className="min-w-0">
                <p className="text-[8px] text-[#5C7A6D] uppercase font-black">{t("maps.time") || "Time"}</p>
                <p className="text-xs font-bold text-white">{routeInfo.duration}</p>
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={() => window.open(`https://yandex.ru/maps/?rtext=~${coords[1]},${coords[0]}&rtt=auto`, "_blank")}
          className="w-full h-12 vaqta-gradient rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg vaqta-glow"
        >
          <Navigation size={14} />
          {t("maps.route")}
        </button>
      </div>
    </motion.div>
  );
}