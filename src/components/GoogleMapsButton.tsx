"use client";

import { MapPin, Navigation, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageProvider";
import { mapsService } from "@/services/mapsService";
import { toast } from "sonner";

interface GoogleMapsButtonProps {
  address?: string;
  latitude?: number;
  longitude?: number;
}

export function GoogleMapsButton({ address, latitude, longitude }: GoogleMapsButtonProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleOpenMaps = () => {
    if (latitude && longitude) {
      mapsService.openGoogleMapsCoordinates(latitude, longitude);
    } else if (address) {
      mapsService.openGoogleMaps(address);
    }
  };

  const handleBuildRoute = () => {
    if (latitude && longitude) {
      mapsService.createRouteToCoordinates(latitude, longitude);
    } else if (address) {
      mapsService.createRouteToLocation(address);
    }
  };

  const handleCopyAddress = () => {
    const targetText = address || (latitude && longitude ? `${latitude}, ${longitude}` : "");
    if (!targetText) return;

    navigator.clipboard.writeText(targetText);
    setCopied(true);
    toast.success(t("common.done"));
    setTimeout(() => setCopied(false), 2000);
  };

  if (!address && (!latitude || !longitude)) return null;

  return (
    <div className="flex flex-col gap-2 w-full mt-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleOpenMaps}
          className="flex items-center justify-center gap-2 h-12 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white hover:bg-white/10 transition-colors"
        >
          <MapPin size={16} className="text-[#00A86B]" />
          <span>{t("maps.open")}</span>
        </button>

        <button
          onClick={handleBuildRoute}
          className="flex items-center justify-center gap-2 h-12 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white hover:bg-white/10 transition-colors"
        >
          <Navigation size={16} className="text-[#D4AF37]" />
          <span>{t("maps.route")}</span>
        </button>
      </div>

      <button
        onClick={handleCopyAddress}
        className="flex items-center justify-center gap-2 h-12 bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl text-xs font-bold text-slate-300 hover:bg-[#112F28] transition-colors"
      >
        {copied ? <Check size={16} className="text-[#00A86B]" /> : <Copy size={16} />}
        <span>{t("maps.copy")}</span>
      </button>
    </div>
  );
}