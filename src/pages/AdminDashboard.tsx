"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Crown, Zap, Scan, Map as MapIcon, Link2, Settings, ArrowRight, RefreshCw } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const nav = useNavigate();
  const [stats, setStats] = useState({ users: 0, premium: 0, ai: 0, ocr: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

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
        ocr: ocrCount || 0
      });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const MENU = [
    { label: "Users", val: stats.users, icon: Users, color: "text-blue-400", path: "/admin/users" },
    { label: "Premium", val: stats.premium, icon: Crown, color: "text-[#D4AF37]", path: "/admin/users" },
    { label: "Integrations", val: "Check", icon: Link2, color: "text-[#00A86B]", path: "/admin/integrations" },
    { label: "AI Usage", val: stats.ai, icon: Zap, color: "text-[#00A86B]", path: "/admin/settings" },
    { label: "OCR Ops", val: stats.ocr, icon: Scan, color: "text-purple-400", path: "/admin/settings" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="Admin Dashboard" showBack />
      <main className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">VAQTA <span className="text-[#00A86B]">FOUNDER</span></h2>
          <button onClick={loadStats} className="p-3 bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl text-[#00A86B]">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {MENU.map((m, i) => (
            <motion.div 
              key={i} 
              whileTap={{ scale: 0.97 }}
              onClick={() => nav(m.path)}
              className="vaqta-glass p-5 border-[#1A3D2E] flex flex-col items-center gap-3 relative group"
            >
              <div className={`p-3 rounded-2xl bg-white/5 ${m.color}`}><m.icon size={24} /></div>
              <div className="text-center">
                <p className="text-2xl font-black">{m.val}</p>
                <p className="text-[9px] font-black uppercase text-[#5C7A6D] tracking-widest">{m.label}</p>
              </div>
              <ArrowRight size={12} className="absolute top-2 right-2 text-[#5C7A6D] opacity-0 group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>

        <button 
          onClick={() => nav("/admin/settings")}
          className="w-full h-16 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest"
        >
          <Settings size={18} /> Global System Settings
        </button>
      </main>
      <BottomNav />
    </div>
  );
}