"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Activity, Bot, Scan, Languages, TrendingUp, ArrowLeft, ShieldAlert, User } from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageProvider";
import { useNavigate } from "react-router-dom";

export default function AdminAnalytics() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 1240,
    newToday: 42,
    aiRequests: 8900,
    scans: 2100,
    translations: 5400
  });

  const cards = [
    { icon: <Users size={24}/>, label: t("admin.stats_users"), value: stats.totalUsers, color: "text-blue-400" },
    { icon: <TrendingUp size={24}/>, label: t("admin.stats_new"), value: stats.newToday, color: "text-emerald-400" },
    { icon: <Bot size={24}/>, label: t("admin.stats_ai"), value: stats.aiRequests, color: "text-orange-400" },
    { icon: <Scan size={24}/>, label: t("admin.stats_scans"), value: stats.scans, color: "text-cyan-400" },
    { icon: <Languages size={24}/>, label: t("admin.stats_trans"), value: stats.translations, color: "text-indigo-400" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white">
      <Header title="nav.admin" showBack />

      <main className="p-6 space-y-8 pb-32">
        <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
          <ShieldAlert className="text-red-500" />
          <p className="text-xs font-bold text-red-200">Административный доступ: {import.meta.env.VITE_ADMIN_USER || "dievds"}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {cards.map((c, i) => (
            <Card key={i} className="vaqta-glass p-6 border-[#1A3D2E] flex flex-col items-center text-center gap-3">
              <div className={`${c.color} p-3 bg-white/5 rounded-2xl`}>{c.icon}</div>
              <div>
                <p className="text-2xl font-black">{c.value.toLocaleString()}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#5C7A6D]">{c.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">Последняя активность</h3>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((u) => (
              <div key={u} className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">User_{8000 + u}</p>
                    <p className="text-[9px] text-[#5C7A6D]">Вошел 5 мин назад</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-[#00A86B] uppercase">Active</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}