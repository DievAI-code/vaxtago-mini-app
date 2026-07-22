"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Zap, Scan, Languages, ShieldCheck, TrendingUp, AlertCircle, Clock, Search, Lock, Database } from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { VaqtaLogo } from "@/components/VaqtaLogo";

export default function FounderDashboard() {
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (pass === "31975") {
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#06140F] flex flex-col items-center justify-center p-6 text-white">
        <VaqtaLogo size={80} animated glow className="mb-6" />
        <h1 className="text-2xl font-black mb-2 tracking-tight">FOUNDER CABINET</h1>
        <p className="text-xs text-[#5C7A6D] uppercase tracking-widest mb-8">Закрытый доступ разработчика</p>

        <div className="w-full max-w-sm space-y-4">
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00A86B]" size={20} />
            <input 
              type="password" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••"
              className="w-full h-16 bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl pl-14 pr-6 text-center text-xl tracking-[0.5em] focus:border-[#00A86B] outline-none transition-all font-mono"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center font-bold">Неверный пароль доступа</p>
          )}

          <button 
            onClick={handleLogin}
            className="w-full h-16 vaqta-gradient rounded-2xl font-black text-lg shadow-xl uppercase tracking-wider"
          >
            Войти в систему
          </button>
        </div>
      </div>
    );
  }

  const METRICS = [
    { label: "Пользователи", val: "1,420", icon: Users, color: "text-blue-400" },
    { label: "AI Запросы", val: "12,890", icon: Zap, color: "text-[#D4AF37]" },
    { label: "Сканы документов", val: "3,110", icon: Scan, color: "text-[#00A86B]" },
    { label: "Переводы", val: "8,450", icon: Languages, color: "text-purple-400" },
  ];

  const RECENT_USERS = [
    { phone: "+7 (909) ***-88-21", lang: "UZ", date: "2 мин назад" },
    { phone: "+7 (926) ***-12-00", lang: "RU", date: "12 мин назад" },
    { phone: "+992 90 ***-44-55", lang: "TG", date: "34 мин назад" },
    { phone: "+7 (911) ***-99-11", lang: "UZ", date: "1 час назад" },
  ];

  return (
    <div className="min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="FOUNDER DASHBOARD" showBack />
      
      <main className="p-6 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          {METRICS.map((m, idx) => (
            <Card key={idx} className="vaqta-glass p-5 border-[#1A3D2E] flex flex-col items-center gap-2 text-center">
              <m.icon className={m.color} size={24} />
              <p className="text-2xl font-black">{m.val}</p>
              <p className="text-[9px] font-black uppercase text-[#5C7A6D] tracking-widest">{m.label}</p>
            </Card>
          ))}
        </div>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">Последние регистрации</h3>
          <div className="space-y-2">
            {RECENT_USERS.map((u, i) => (
              <div key={i} className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#00A86B] font-bold text-xs">
                    {u.lang}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{u.phone}</p>
                    <p className="text-[9px] text-[#5C7A6D]">{u.date}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-[#00A86B] bg-[#00A86B]/10 px-2 py-1 rounded-lg">ONLINE</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">Логи ошибок и системы</h3>
          <div className="vaqta-glass p-4 border-[#1A3D2E] font-mono text-[10px] text-slate-400 space-y-2">
            <p className="text-[#00A86B]">[OK] Nominatim OpenStreetMap API connected.</p>
            <p className="text-[#00A86B]">[OK] Supabase client auth initialized.</p>
            <p className="text-[#D4AF37]">[INFO] Vision Edge function cold start (240ms).</p>
          </div>
        </section>
      </main>
    </div>
  );
}