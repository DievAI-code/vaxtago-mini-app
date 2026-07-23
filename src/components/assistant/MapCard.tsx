"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, Ruler, ExternalLink, Crosshair, Loader2, AlertCircle } from "lucide-react";
import { YandexMap } from "../maps/YandexMap";
import { useLanguage } from "@/context/LanguageProvider";
import { geocodingService } from "@/services/geocodingService";
import { toast } from "sonner";

interface MapCardProps {
  query?: string;
  type?: "search" | "route" | "nearby";
  onActionComplete?: () => void;
}

export function MapCard({ query, type = "search", onActionComplete }: MapCardProps) {
  const { t } = useLanguage();
  const [targetCoords, setTargetCoords] = useState<[number, number] | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [addressName, setAddressName] = useState("");

  useEffect(() => {
    initMap();
  }, [query]);

  const initMap = async () => {
    setLoading(true);
    try {
      if (query) {
        const results = await geocodingService.searchAddress(query);
        if (results && results.length > 0) {
          setTargetCoords([results[0].longitude, results[0].latitude]);
          setAddressName(results[0].display_name);
        }
      }

      if (type === "route" || type === "nearby" || !query) {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
              setUserCoords(coords);
              if (!query) {
                setTargetCoords(coords);
                geocodingService.reverseGeocode(coords[1], coords[0]).then(setAddressName);
              }
            },
            () => toast.error(t("common.error"))
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      onActionComplete?.();
    }
  };

  if (loading) return (
    <div className="w-full h-44 vaqta-glass flex flex-col items-center justify-center border-[#1A3D2E] gap-3">
      <Loader2 className="animate-spin text-[#00A86B]" size={24} />
      <span className="text-[10px] font-black uppercase text-[#5C7A6D]">{t("common.loading")}</span>
    </div>
  );

  if (!targetCoords) return (
    <div className="w-full vaqta-glass p-4 border-red-500/20 flex items-center gap-3">
      <AlertCircle className="text-red-500" size={20} />
      <span className="text-xs font-bold text-slate-400">Адрес не найден: {query}</span>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="w-full vaqta-glass overflow-hidden border-[#00A86B]/30 shadow-2xl my-2"
    >
      <div className="h-48 relative">
        <YandexMap 
          center={targetCoords} 
          zoom={15} 
          markers={[{
            id: "target",
            title: addressName,
            salary: "",
            city: "",
            address: addressName,
            coordinates: targetCoords,
            type: type === "nearby" ? "verified" : "premium",
            employerName: query || "Цель"
          }]}
          userLocation={userCoords}
          className="w-full h-full rounded-none"
        />
        
        <div className="absolute top-3 left-3 bg-[#06140F]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 max-w-[80%]">
          <MapPin size={12} className="text-[#00A86B] flex-shrink-0" />
          <span className="text-[9px] font-black uppercase text-white truncate">{addressName}</span>
        </div>
      </div>

      <div className="p-4 bg-[#0C1F1A] border-t border-[#1A3D2E] space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => window.open(`https://yandex.ru/maps/?text=${encodeURIComponent(addressName)}`, "_blank")}
            className="h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase text-white"
          >
            <ExternalLink size={14} /> {t("maps.open")}
          </button>
          <button 
            onClick={() => window.open(`https://yandex.ru/maps/?rtext=~${targetCoords[1]},${targetCoords[0]}&rtt=auto`, "_blank")}
            className="h-10 vaqta-gradient rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase text-white shadow-lg vaqta-glow"
          >
            <Navigation size={14} /> {t("maps.route")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}