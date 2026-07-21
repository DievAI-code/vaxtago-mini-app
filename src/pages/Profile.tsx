"use client";

import { motion } from "framer-motion";
import { 
  User, 
  Settings, 
  Clock, 
  CreditCard, 
  LogOut, 
  ChevronRight,
  Shield,
  Bell,
  Mail,
  Phone
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTelegramUser } from "@/components/TelegramProvider";
import { FadeUp, stagger, fadeUp } from "@/components/animations";

export default function Profile() {
  const { firstName, logout } = useTelegramUser();

  const menu = [
    { icon: <Clock size={20} />, label: "История операций", color: "text-blue-500" },
    { icon: <CreditCard size={20} />, label: "Подписка и платежи", color: "text-purple-500" },
    { icon: <Shield size={20} />, label: "Безопасность", color: "text-green-500" },
    { icon: <Settings size={20} />, label: "Настройки", color: "text-slate-400" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] pb-32">
      <header className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Профиль</h1>
        <button className="p-2 bg-[#18181B] border border-[#27272A] rounded-xl text-slate-400">
          <Bell size={20} />
        </button>
      </header>

      <main className="px-6 space-y-8">
        {/* User Info */}
        <FadeUp>
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-[2rem] vg-gradient p-1">
                <div className="w-full h-full rounded-[1.8rem] bg-[#09090B] flex items-center justify-center overflow-hidden">
                  <img src="https://avatar.vercel.sh/user" alt="avatar" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#22C55E] border-4 border-[#09090B] rounded-full" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{firstName || "Дмитрий Диев"}</h2>
              <p className="text-slate-500 text-sm">VaxtaGo Premium до 12.03.2026</p>
            </div>
          </div>
        </FadeUp>

        {/* Contact Info */}
        <FadeUp>
          <div className="grid grid-cols-1 gap-3">
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500">
                <Mail size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Email</p>
                <p className="text-sm font-semibold text-slate-200">hello@vaxtago.app</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="bg-green-500/10 p-3 rounded-2xl text-green-500">
                <Phone size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Телефон</p>
                <p className="text-sm font-semibold text-slate-200">+7 (999) 000-00-00</p>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Menu Items */}
        <section className="space-y-3">
          {menu.map((item, i) => (
            <motion.div
              key={item.label}
              whileHover={{ x: 4 }}
              className="glass-card p-4 flex items-center gap-4 cursor-pointer"
            >
              <div className={`${item.color} bg-white/5 p-3 rounded-2xl`}>
                {item.icon}
              </div>
              <span className="flex-1 font-semibold text-sm">{item.label}</span>
              <ChevronRight size={18} className="text-slate-600" />
            </motion.div>
          ))}
        </section>

        {/* Logout */}
        <FadeUp>
          <button 
            onClick={logout}
            className="w-full p-4 flex items-center justify-center gap-2 text-red-500 font-bold border border-red-500/20 rounded-[1.5rem] hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            Выйти из аккаунта
          </button>
        </FadeUp>
      </main>

      <BottomNav />
    </div>
  );
}