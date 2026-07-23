"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, ExternalLink, Loader2 } from "lucide-react";
import { YandexMap } from "../maps/YandexMap";
import { useLanguage } from "@/context/LanguageProvider";
import { geocodingService } from "@/services/geocodingService";

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
        } else {
          setAddressName(query);
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
            () => {}
          );
        }
      }
    } catch (err) {
      console.warn("MapCard geocode error:", err);
      setAddressName(query || "Адрес");
    } finally {
      setLoading(false);
      onActionComplete?.();
    }
  };

  if (loading) return (
    <div className="w-full h-36 vaqta-glass flex flex-col items-center justify-center border-[#1A3D2E] gap-2">
      <Loader2 className="animate-spin text-[#00A86B]" size={20} />
      <span className="text-[10px] font-black uppercase text-[#5C7A6D]">{t("common.loading")}</span>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="w-full vaqta-glass overflow-hidden border-[#00A86B]/30 shadow-2xl my-2"
    >
      <div className="h-44 relative">
        <YandexMap 
          center={targetCoords || [69.2401, 41.2995]} 
          zoom={14} 
          markers={targetCoords ? [{
            id: "target",
            title: addressName,
            salary: "",
            city: "",
            address: addressName,
            coordinates: targetCoords,
            type: "verified",
            employerName: query || "Локация"
          }] : []}
          userLocation={userCoords}
          className="w-full h-full rounded-none"
        />
        
        <div className="absolute top-3 left-3 bg-[#06140F]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 max-w-[85%]">
          <MapPin size={12} className="text-[#00A86B] flex-shrink-0" />
          <span className="text-[9px] font-black uppercase text-white truncate">{addressName || query || "Адрес"}</span>
        </div>
      </div>

      <div className="p-3 bg-[#0C1F1A] border-t border-[#1A3D2E]">
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => window.open(`https://yandex.ru/maps/?text=${encodeURIComponent(addressName || query || "")}`, "_blank")}
            className="h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase text-white"
          >
            <ExternalLink size={14} /> Яндекс Карты
          </button>
          <button 
            onClick={() => {
              if (targetCoords) {
                window.open(`https://yandex.ru/maps/?rtext=~${targetCoords[1]},${targetCoords[0]}&rtt=auto`, "_blank");
              } else {
                window.open(`https://yandex.ru/maps/?text=${encodeURIComponent(query || "")}`, "_blank");
              }
            }}
            className="h-10 vaqta-gradient rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase text-white shadow-lg vaqta-glow"
          >
            <Navigation size={14} /> Маршрут
          </button>
        </div>
      </div>
    </motion.div>
  );
}
</dyad-file>

<dyad-write path="src/pages/Maps.tsx" description="Interactive Maps page with clean fallback UI when search/routes are accessed">
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { VaqtaMap } from "@/components/maps/VaqtaMap";
import { useLanguage } from "@/context/LanguageProvider";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function MapsPage() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const search = searchParams.get("search");
    const route = searchParams.get("route");

    if (search) {
      setSearchQuery(search);
    } else if (route) {
      setSearchQuery(route);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="nav.map" onMenuClick={() => setIsMenuOpen(true)} showBack />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#00A86B]/10 text-[#00A86B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#00A86B]/20 mb-2">
              <Sparkles size={12} /> VAQTA Maps AI
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {searchQuery ? `Карта: ${searchQuery}` : "Интерактивная карта"}
            </h1>
          </div>
          <button
            onClick={() => nav("/ai")}
            className="p-3 bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl text-[#00A86B] hover:scale-105 active:scale-95 transition-all"
            title="Вернуться к AI чату"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        <VaqtaMap searchQuery={searchQuery} />

        <div className="vaqta-glass p-6 border-[#1A3D2E] space-y-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <span>💡</span> Как искать места через AI:
          </h3>
          <ul className="text-xs text-[#5C7A6D] space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <span className="text-[#00A86B]">RU:</span> "Покажи железнодорожный вокзал"
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#00A86B]">UZ:</span> "Toshkent aeroportini kartada ko'rsat"
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#00A86B]">TJ:</span> "Маршрут до миграционного центра"
            </li>
          </ul>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}