"use client";

import { motion } from "framer-motion";
import { 
  User, Sparkles, Settings, Crown, Globe,
  ChevronRight, LogOut, Clock, Zap,
  Languages, Database, Moon, Phone, MapPin
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { useLanguage } from "@/context/LanguageProvider";
import { useApp } from "@/lib/theme";
import { useNavigate } from "react-router-dom";
import { FadeUp } from "@/components/animations";
import { useState, useEffect } from "react";

interface PlacesHistory {
  name: string;
  address: string;
  lat: number;
  lng: number;
  date: string;
}

export default function Profile() {
  const { t, language } = useLanguage();
  const { navigate } = useNavigate() as any; // safe fallback or standard call
  const nav = useNavigate();
  const [historyPlaces, setHistoryPlaces] = useState<PlacesHistory[]>([]);
  
  const userPhone = localStorage.getItem("vaxtago_user_phone") || "+7 (900) 000-00-00";

  useEffect(() => {
    try {
      const cached = localStorage.getItem("vaqta_places_history");
      if (cached) {
        setHistoryPlaces(JSON.parse(cached));
      }
    } catch {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vaxtago_auth");
    nav("/login", { replace: true });
  };

  const SECTIONS = [
    {
      id: "user",
      title: t("profile.user_info") || "Корбар",
      items: [
        { icon: User, label: t("profile.user_name") || "VAQTA User", value: "VAQTA User", color: "text-blue-400" },
        { icon: Phone, label: t("profile.user_phone") || "Номер", value: userPhone, color: "text-emerald-400" },
        { icon: Globe, label: t("profile.user_lang") || "Язык", value: language.toUpperCase(), color: "text-[#00A86B]" },
      ]
    },
    {
      id: "ai",
      title: t("profile.ai_activity") || "Интеллект",
      items: [
        { icon: Zap, label: t("profile.ai_requests") || "AI запросы", value: "124", color: "text-orange-400" },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-40">
      <Header title="nav.profile" />

      <main className="px-6 mt-8 space-y-10">
        <FadeUp>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-[2.5rem] vaqta-gradient p-1 shadow-2xl">
                <div className="w-full h-full rounded-[2.4rem] bg-[#06140F] flex items-center justify-center overflow-hidden">
                  <img src="https://avatar.vercel.sh/vaqta" alt="avatar" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#D4AF37] rounded-full border-4 border-[#06140F] flex items-center justify-center text-white">
                <Crown size={14} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">VAQTA User</h2>
              <p className="text-[#00A86B] text-[10px] font-black uppercase tracking-widest mt-1">Premium Member</p>
            </div>
          </div>
        </FadeUp>

        {SECTIONS.map((section) => (
          <section key={section.id} className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D] ml-2">{section.title}</h3>
            <div className="space-y-2">
              {section.items.map((item, idx) => (
                <motion.div 
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.onClick}
                  className="vaqta-glass p-5 flex items-center gap-4 border-[#1A3D2E] group cursor-pointer"
                >
                  <div className={`p-3 rounded-2xl bg-white/5 ${item.color || "text-[#5C7A6D]"} group-hover:scale-110 transition-transform`}>
                    <item.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">{item.label}</p>
                    {item.value && <p className="text-[10px] text-[#5C7A6D] font-black uppercase mt-0.5">{item.value}</p>}
                  </div>
                  <ChevronRight size={18} className="text-[#1A3D2E] group-hover:text-[#00A86B] transition-colors" />
                </motion.div>
              ))}
            </div>
          </section>
        ))}

        {historyPlaces.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] ml-2">История мест</h3>
            <div className="space-y-2">
              {historyPlaces.map((place, idx) => (
                <motion.div 
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`, "_blank")}
                  className="vaqta-glass p-5 flex items-center gap-4 border-[#1A3D2E]/40 group cursor-pointer"
                >
                  <div className="p-3 rounded-2xl bg-white/5 text-[#D4AF37] group-hover:scale-110 transition-transform">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{place.name}</p>
                    <p className="text-[10px] text-[#5C7A6D] truncate mt-0.5">{place.address}</p>
                  </div>
                  <ChevronRight size={18} className="text-[#1A3D2E] group-hover:text-[#00A86B] transition-colors" />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <FadeUp>
          <button 
            onClick={handleLogout}
            className="w-full h-16 rounded-[2rem] border border-red-500/20 bg-red-500/5 text-red-500 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            {t("profile.logout")}
          </button>
        </FadeUp>
      </main>

      <BottomNav />
    </div>
  );
}