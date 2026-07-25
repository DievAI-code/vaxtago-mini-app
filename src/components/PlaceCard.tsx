"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Star, Navigation, Building2 } from "lucide-react";
import { MapLocation } from "@/services/maps/types";
import { RouteProviderSelector } from "@/components/RouteProviderSelector";
import { useState } from "react";

interface PlaceCardProps {
  place: MapLocation;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const [showRoute, setShowRoute] = useState(false);

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
          <p className="text-xs text-[#5C7A6D] truncate">{place.address}</p>
        </div>
        {place.rating && (
          <div className="flex items-center gap-1 text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded-lg">
            <Star size={12} />
            {place.rating.toFixed(1)}
          </div>
        )}
      </div>

      {(place.phone || place.hours) && (
        <div className="grid grid-cols-2 gap-2">
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

      <button
        onClick={() => setShowRoute(!showRoute)}
        className="w-full h-10 vaqta-gradient rounded-xl text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <Navigation size={14} />
        <span>Построить маршрут</span>
      </button>

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