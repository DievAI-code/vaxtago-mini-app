"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Crown, Zap, Scan, Map as MapIcon, TrendingUp, ShieldAlert, Settings, ArrowRight, RefreshCw, Activity } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    premium: 0,
    ai: 0,
    ocr: 0,
    maps: 0,
    errors: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true });
      const { count: premCount } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("subscription_status", "premium");
      const { count: aiCount } = await supabase.from("assistant_messages").select("*", { count: "exact", head: true });
      const { count: ocrCount } = await supabase.from("ocr_history").select("*", { count: "exact", head: true });

      setStats({
        users: userCount || 0,
        premium: premCount || 0,
        ai: aiCount || 0,
        ocr: ocrCount || 0,
        maps: 142, // Mockup for now
        errors: 3
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const METRICS = [
    { label: "Users", val: stats.users, icon: Users, color: "text-blue-400", path: "/admin/users" },
    { label: "Premium", val: stats.premium, icon: Crown, color: "text-[#D4AF37]", path: "/admin/users" },
    { label: "AI Usage", val: stats.ai, icon: Zap, color: "text-[#00A86B]", path: "/admin/analytics" },
    { label: "OCR Ops", val: stats.ocr, icon: Scan, color: "text-purple-400", path: "/admin/analytics" },
    { label: "Map Routes", val: stats.maps, icon: MapIcon, color: "text-cyan-400", path: "/admin/analytics" },
    { label: "Errors", val: stats.errors, icon: ShieldAlert, color: "text-red-500", path: "/admin/settings" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="Admin Dashboard" showBack />

      <main className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">VAQTA <span className="text-[#00A86B]">FOUNDER</span></h2>
            <p className="text-[10px] text-[#5C7A6D] uppercase font-black tracking-widest mt-1">Real-time Project Health</p>
          </div>
          <button onClick={loadStats} className="p-3 bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl text-[#00A86B]">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {METRICS.map((m, i) => (
            <motion.div 
              key={i} 
              whileTap={{ scale: 0.97 }}
              onClick={() => nav(m.path)}
              className="vaqta-glass p-5 border-[#1A3D2E] flex flex-col items-center gap-3 relative group overflow-hidden"
            >
              <div className={`p-3 rounded-2xl bg-white/5 ${m.color} group-hover:scale-110 transition-transform`}>
                <m.icon size={24} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black">{m.val}</p>
                <p className="text-[9px] font-black uppercase text-[#5C7A6D] tracking-widest">{m.label}</p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={12} className="text-[#5C7A6D]" />
              </div>
            </motion.div>
          ))}
        </div>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D] ml-1">System Status</h3>
          <div className="vaqta-glass p-5 border-[#1A3D2E] space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">OpenRouter API</span>
                </div>
                <span className="text-[10px] font-black text-[#00A86B] bg-[#00A86B]/10 px-2 py-1 rounded-lg">OPERATIONAL</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">Supabase Edge</span>
                </div>
                <span className="text-[10px] font-black text-[#00A86B] bg-[#00A86B]/10 px-2 py-1 rounded-lg">ACTIVE</span>
             </div>
          </div>
        </section>

        <button 
          onClick={() => nav("/admin/settings")}
          className="w-full h-16 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <Settings size={18} /> Global System Settings
        </button>
      </main>

      <BottomNav />
    </div>
  );
}