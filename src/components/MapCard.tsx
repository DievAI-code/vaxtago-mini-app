"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, Ruler, ExternalLink, Crosshair, Loader2 } from "lucide-react";
import { YandexMap } from "./maps/YandexMap";
import { useLanguage } from "@/context/LanguageProvider";
import { geocodingService } from "@/services/geocodingService";
import { toast } from "sonner";

interface MapCardProps {
  address?: string;
  type?: "search" | "route" | "nearby";
  title?: string;
}

export function MapCard({ address, type = "search", title }: MapCardProps) {
  const { t } = useLanguage();
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{ dist: string; time: string } | null>(null);

  useEffect(() => {
    if (address) {
      handleInit();
    }
  }, [address]);

  const handleInit = async () => {
    try {
      setLoading(true);
      const results = await geocodingService.searchAddress(address!);
      if (results.length > 0) {
        setCoords([results[0].longitude, results[0].latitude]);
      }

      if (type === "route") {
        await getMyLocation();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getMyLocation = async () => {
    return new Promise((resolve) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const up: [number, number] = [pos.coords.longitude, pos.coords.latitude];
            setUserPos(up);
            setRouteInfo({ dist: "—", time: "—" }); // В реальности расчет через API
            resolve(up);
          },
          () => {
            toast.error(t("common.error"));
            resolve(null);
          }
        );
      } else resolve(null);
    });
  };

  if (loading) return (
    <div className="w-full h-40 vaqta-glass flex items-center justify-center border-[#1A3D2E]">
      <Loader2 className="animate-spin text-[#00A86B]" />
    </div>
  );

  if (!coords) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }}
      className="w-full vaqta-glass overflow-hidden border-[#00A86B]/20 shadow-2xl my-3"
    >
      <div className="h-44 relative">
        <YandexMap 
          center={coords} 
          zoom={15} 
          markers={[{
            id: "dest",
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
        <div className="absolute top-3 left-3 bg-[#06140F]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
          <MapPin size={12} className="text-[#00A86B]" />
          <span className="text-[10px] font-black uppercase text-white truncate max-w-[120px]">{address}</span>
        </div>
      </div>

      <div className="p-4 bg-[#0C1F1A]/95 border-t border-[#1A3D2E]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <Ruler size={14} className="text-[#5C7A6D]" />
                <span className="text-xs font-bold">{routeInfo?.dist || "—"}</span>
             </div>
             <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#D4AF37]" />
                <span className="text-xs font-bold">{routeInfo?.time || "—"}</span>
             </div>
          </div>
          <button 
            onClick={getMyLocation}
            className="p-2 bg-white/5 rounded-xl text-[#00A86B] hover:bg-white/10"
          >
            <Crosshair size={16} />
          </button>
        </div>

        <button 
          onClick={() => window.open(`https://yandex.ru/maps/?rtext=~${coords[1]},${coords[0]}&rtt=auto`, "_blank")}
          className="w-full h-12 vaqta-gradient rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg vaqta-glow"
        >
          <Navigation size={14} />
          {t("map.route")}
        </button>
      </div>
    </motion.div>
  );
}