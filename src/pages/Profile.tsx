"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Phone, Globe, Crown, Zap, Scan,
  Map as MapIcon, Calendar, Settings, LogOut,
  ChevronRight, ShieldCheck, Clock, ArrowRight, Key
} from "lucide-react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { getUserByPhone, createUser, checkPremiumAccess } from "@/services/userService";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const rawPhone = localStorage.getItem("vaxtago_user_phone");
    if (!rawPhone) {
      nav("/login");
      return;
    }

    try {
      let user = await getUserByPhone(rawPhone);

      if (!user) {
        user = await createUser(rawPhone);
        if (!user) {
          toast.error("Не удалось загрузить профиль");
          return;
        }
      }

      setUserData(user);
    } catch (err) {
      toast.error("Не удалось загрузить профиль");
      console.error("Profile load exception:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vaxtago_auth");
    localStorage.removeItem("vaxtago_user_phone");
    localStorage.removeItem("vaqta_admin_token");
    toast.success(t("common.done"));
    nav("/login");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#06140F] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#00A86B]/20 border-t-[#00A86B] animate-spin rounded-full" />
    </div>
  );

  const isFounder = userData?.role === 'founder';
  const premiumCheck = checkPremiumAccess(userData);

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="profile.title" onMenuClick={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="p-6 space-y-6">
        <section className="flex flex-col items-center text-center gap-4 py-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-[2.5rem] vaqta-gradient p-1 shadow-2xl">
              <div className="w-full h-full rounded-[2.4rem] bg-[#06140F] flex items-center justify-center">
                <User size={40} className="text-[#00A86B]" />
              </div>
            </div>
            {premiumCheck.isPremium && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#D4AF37] rounded-full border-4 border-[#06140F] flex items-center justify-center text-black">
                <Crown size={14} />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black">{userData?.first_name || "VAQTA User"}</h2>
            <p className="text-xs text-[#5C7A6D] font-bold uppercase tracking-widest">{userData?.phone_number}</p>
          </div>
        </section>

        {isFounder && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => nav("/admin")}
            className="w-full p-5 vaqta-glass border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/10 to-transparent flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
                <Key size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase text-[#D4AF37] tracking-widest">{t("profile.admin_panel")}</p>
                <p className="text-[10px] text-[#D4AF37]/60 font-bold uppercase">System Control Center</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
          </motion.button>
        )}

        <div className={`vaqta-glass p-6 border ${premiumCheck.isPremium ? 'border-[#D4AF37]/40 shadow-[0_0_30px_rgba(212,175,55,0.1)]' : 'border-[#1A3D2E]'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">{t("profile.subscription")}</p>
              <h3 className={`text-xl font-black mt-1 ${premiumCheck.isPremium ? 'vaqta-gold-text' : 'text-white'}`}>
                {premiumCheck.isPremium ? 'VAQTA PREMIUM' : 'VAQTA FREE'}
              </h3>
            </div>
            {!premiumCheck.isPremium && (
              <button onClick={() => nav("/premium")} className="bg-[#00A86B] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg vaqta-glow">
                Upgrade
              </button>
            )}
          </div>
          {premiumCheck.isPremium && userData?.subscription_expires_at && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#D4AF37] uppercase">
              <Clock size={12} />
              <span>{t("profile.expires")}: {new Date(userData.subscription_expires_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D] ml-2">{t("profile.usage")}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="vaqta-glass p-4 border-[#1A3D2E] text-center space-y-1">
              <Zap size={16} className="mx-auto text-[#00A86B]" />
              <p className="text-lg font-black">{userData?.ai_requests_used || 0}</p>
              <p className="text-[8px] uppercase font-black text-[#5C7A6D]">AI</p>
            </div>
            <div className="vaqta-glass p-4 border-[#1A3D2E] text-center space-y-1">
              <Scan size={16} className="mx-auto text-purple-400" />
              <p className="text-lg font-black">{userData?.ocr_requests_used || 0}</p>
              <p className="text-[8px] uppercase font-black text-[#5C7A6D]">OCR</p>
            </div>
            <div className="vaqta-glass p-4 border-[#1A3D2E] text-center space-y-1">
              <MapIcon size={16} className="mx-auto text-cyan-400" />
              <p className="text-lg font-black">{userData?.map_requests_used || 0}</p>
              <p className="text-[8px] uppercase font-black text-[#5C7A6D]">Maps</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D] ml-2">{t("profile.settings")}</h3>
          <div className="space-y-2">
            <div className="vaqta-glass p-5 border-[#1A3D2E] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/5 text-[#00A86B]"><Globe size={18} /></div>
                <div>
                  <p className="text-xs font-bold">{t("profile.language")}</p>
                  <p className="text-[10px] uppercase font-black text-[#5C7A6D]">{language.toUpperCase()}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#1A3D2E]" />
            </div>

            <button
              onClick={handleLogout}
              className="w-full vaqta-glass p-5 border-red-500/20 bg-red-500/5 flex items-center gap-4 active:scale-95 transition-transform"
            >
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-500"><LogOut size={18} /></div>
              <span className="text-xs font-black uppercase tracking-widest text-red-400">{t("logout")}</span>
            </button>
          </div>
        </section>

        <p className="text-center text-[9px] text-[#5C7A6D] uppercase font-black tracking-widest pt-4">
          VAQTA AI v3.0 • Joined {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : '—'}
        </p>
      </main>

      <BottomNav />
    </div>
  );
}