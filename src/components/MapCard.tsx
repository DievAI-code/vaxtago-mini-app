"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, Ruler, ExternalLink, Crosshair, Loader2 } from "lucide-react";
import { Map as OsmMap } from "@/components/Map";
import { useLanguage } from "@/context/LanguageProvider";
import { geocodingService } from "@/services/geocodingService";
import { navigationService, NavigationProvider } from "@/services/navigation";
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
        setCoords([results[0].latitude, results[0].longitude]);
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
            const up: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setUserPos(up);
            setRouteInfo({ dist: "—", time: "—" });
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

  const handleProviderSelect = (provider: NavigationProvider) => {
    const fromLabel = userPos ? "Моё местоположение" : "Москва";
    navigationService.openRoute(provider, { from: fromLabel, to: address || "", mode: "car" });
  };

  const links = address
    ? navigationService.buildRoute({ from: "Моё местоположение", to: address, mode: "car" })
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full vaqta-glass overflow-hidden border-[#00A86B]/20 shadow-2xl my-3"
    >
      <div className="h-44 relative">
        <OsmMap
          center={coords}
          zoom={15}
          markers={[{
            id: "dest",
            title: title || address || "Point",
            coordinates: coords,
          }]}
          userLocation={userPos}
          className="w-full h-full rounded-none"
        />
        <div className="absolute top-3 left-3 bg-[#06140F]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 z-[1000]">
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

        <div className="grid grid-cols-2 gap-2">
          {links.map((link) => (
            <button
              key={link.provider}
              type="button"
              onClick={() => handleProviderSelect(link.provider)}
              className="h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-white hover:border-[#00A86B]/40 hover:bg-[#00A86B]/5 transition-all active:scale-95"
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                link.provider === "yandex"
                  ? "bg-[#FFCC00]/20 text-[#FFCC00]"
                  : "bg-[#00A86B]/20 text-[#00A86B]"
              }`}>
                {link.provider === "yandex" ? "Я" : "2"}
              </div>
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}