"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Search, MapPin, Briefcase, Camera, FileText, Globe, 
  Navigation, Hospital, Train, Plane, Scale, ShieldAlert,
  Bot, Sparkles
} from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { BottomNav } from "@/components/BottomNav";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { Header } from "@/components/Header";

export default function Home() {
  const nav = useNavigate();
  const { t } = useLanguage();

  const CATEGORIES = [
    { id: "maps", icon: MapPin, label: "home.cat_map", color: "text-blue-400", path: "/maps" },
    { id: "jobs", icon: Briefcase, label: "home.cat_jobs", color: "text-[#0AA86E]", path: "/jobs-test" },
    { id: "photo", icon: Camera, label: "home.cat_photo", color: "text-purple-400", path: "/scanner" },
    { id: "docs", icon: FileText, label: "home.cat_docs", color: "text-amber-400", path: "/contract-audit" },
    { id: "text", icon: Globe, label: "home.cat_text", color: "text-cyan-400", path: "/ai" },
    { id: "route", icon: Navigation, label: "home.cat_route", color: "text-blue-500", path: "/maps" },
    { id: "hospitals", icon: Hospital, label: "home.cat_hospitals", color: "text-red-400", path: "/maps?q=hospital" },
    { id: "stations", icon: Train, label: "home.cat_stations", color: "text-slate-400", path: "/maps?q=station" },
    { id: "airports", icon: Plane, label: "home.cat_airports", color: "text-sky-400", path: "/maps?q=airport" },
    { id: "lawyer", icon: Scale, label: "home.cat_lawyer", color: "text-indigo-400", path: "/ai?cmd=lawyer" },
    { id: "sos", icon: ShieldAlert, label: "home.cat_sos", color: "text-red-500", path: "/sos" },
    { id: "location", icon: MapPin, label: "home.cat_location", color: "text-[#0AA86E]", path: "/maps?action=locate" },
  ];

  return (
    <div className="flex flex-col h-screen-dynamic overflow-hidden pb-safe">
      <Header title="VAQTA AI" />

      <main className="flex-1 overflow-y-auto px-6 pt-4 pb-32 no-scrollbar">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
             <VaqtaLogo size={48} animated glow />
             <div>
               <h1 className="vaqta-gradient-text text-3xl font-black">VAQTA AI</h1>
               <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[12px]">{t("app_greeting")}</p>
             </div>
          </div>
          <h2 className="text-2xl font-black text-white leading-tight mb-6">{t("app_question")}</h2>

          <div 
            onClick={() => nav("/ai")}
            className="liquid-glass p-4 rounded-[2rem] flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#0AA86E] flex items-center justify-center text-white shadow-lg shadow-[#0AA86E]/20">
               <Search size={22} />
            </div>
            <span className="text-slate-500 font-bold text-base">{t("search_placeholder")}</span>
            <Sparkles size={18} className="ml-auto text-white/20 group-hover:text-[#0AA86E] transition-colors" />
          </div>
        </motion.section>

        <section className="grid grid-cols-2 gap-4">
          {CATEGORIES.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => nav(cat.path)}
              className="glass-card p-6 flex flex-col items-center justify-center text-center gap-3 active:scale-95 group"
            >
              <div className={`p-3 rounded-2xl bg-white/5 ${cat.color} group-hover:scale-110 transition-transform`}>
                <cat.icon size={28} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-white leading-tight">
                {t(cat.label)}
              </span>
            </motion.div>
          ))}
        </section>

        <Footer />
      </main>

      <BottomNav />
    </div>
  );
}

function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="mt-12 py-10 border-t border-white/5 space-y-6">
      <div className="flex items-center gap-4">
         <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#0AA86E]">
           <Bot size={24} />
         </div>
         <div>
            <p className="text-sm font-black text-white uppercase tracking-widest">VAQTA AI</p>
            <p className="text-[10px] font-bold text-[#0AA86E] uppercase tracking-[0.2em]">AI Platform</p>
         </div>
      </div>
      <p className="text-xs text-[#5C7A6D] font-medium leading-relaxed italic">
        {t("founder.desc")}
      </p>
      <div className="flex items-center justify-between pt-4">
         <span className="text-[10px] font-black text-[#5C7A6D] uppercase tracking-widest">© 2026 VAQTA AI. All rights reserved.</span>
         <div className="flex gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0AA86E] animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
         </div>
      </div>
    </footer>
  );
}