"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Star, Navigation, Building2, Share2, Ruler } from "lucide-react";
import { MapLocation } from "@/services/maps/types";
import { RouteProviderSelector } from "@/components/RouteProviderSelector";
import { useState } from "react";
import { toast } from "sonner";

interface PlaceCardProps {
  place: MapLocation;
  distance?: string;
}

export function PlaceCard({ place, distance }: PlaceCardProps) {
  const [showRoute, setShowRoute] = useState(false);

  const handleShare = async () => {
    const text = `${place.name}\n${place.address}${place.phone ? `\n📞 ${place.phone}` : ""}`;
    if (navigator.share) {
      try {
        await navigator.share({ text, title: place.name });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Скопировано");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full vaqta-glass border-[#00A86B]/30 p-4 space-y-3 my-2"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00A86B]/10 flex items-center justify-center flex-shrink-0">
          <Building2 size={20} className="text-[#00A86B]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-white truncate">{place.name}</h4>
          {place.category && (
            <span className="text-[9px] font-black uppercase text-[#00A86B] bg-[#00A86B]/10 px-1.5 py-0.5 rounded">
              {place.category}
            </span>
          )}
          <p className="text-xs text-[#5C7A6D] truncate mt-1">{place.address}</p>
        </div>
        {place.rating && (
          <div className="flex items-center gap-1 text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded-lg">
            <Star size={12} />
            {place.rating.toFixed(1)}
          </div>
        )}
      </div>

      {(place.phone || place.hours || distance) && (
        <div className="grid grid-cols-2 gap-2">
          {distance && (
            <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
              <Ruler size={14} className="text-[#00A86B]" />
              <span className="text-xs font-bold text-white truncate">{distance}</span>
            </div>
          )}
          {place.phone && (
            <a href={`tel:${place.phone}`} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition">
              <Phone size={14} className="text-blue-400" />
              <span className="text-xs font-bold text-white truncate">{place.phone}</span>
            </a>
          )}
          {place.hours && (
            <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
              <Clock size={14} className="text-[#D4AF37]" />
              <span className="text-xs font-bold text-white truncate">{place.hours}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowRoute(!showRoute)}
          className="h-10 vaqta-gradient rounded-xl text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Navigation size={14} />
          <span>Маршрут</span>
        </button>
        <button
          onClick={handleShare}
          className="h-10 bg-white/5 border border-white/10 rounded-xl text-[#5C7A6D] text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition"
        >
          <Share2 size={14} />
          <span>Поделиться</span>
        </button>
      </div>

      {showRoute && (
        <RouteProviderSelector
          from="Моё местоположение"
          to={place.name}
          mode="car"
          onClose={() => setShowRoute(false)}
        />
      )}
    </motion.div>
  );
}