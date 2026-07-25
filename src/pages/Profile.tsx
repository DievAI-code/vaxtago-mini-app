"use client";

import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Phone, Globe, Crown, Zap, Scan,
  Map as MapIcon, LogOut, ChevronRight, ShieldCheck,
  Clock, Key, Heart, FileText, Settings, HelpCircle, MessageCircle
} from "lucide-react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { getUserByPhone, createUser, checkPremiumAccess } from "@/services/userService";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SectionLabel = memo(function SectionLabel({ text }: { text: string }) {
  return (
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D] ml-2 mb-2">
      {text}
    </h3>
  );
});

const ProfileRow = memo(function ProfileRow({ icon: Icon, label, onClick, color, badge }: { icon: any; label: string; onClick: () => void; color: string; badge?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full vaqta-glass p-4 flex items-center gap-4 active:scale-[0.99] transition-transform hover:border-[#0AA86E]/30"
    >
      <div className={`p-2.5 rounded-2xl bg-white/5 ${color}`}>
        <Icon size={18} />
      </div>
      <span className="text-xs font-bold text-white flex-1 text-left">{label}</span>
      {badge && <span className="text-[10px] font-black text-[#D4AF37] uppercase">{badge}</span>}
      <ChevronRight size={16} className="text-[#5C7A6D]" />
    </motion.button>
  );
});

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const rawPhone = localStorage.getItem("vaxtago_user_phone");
      if (!rawPhone) {
        nav("/login");
        return;
      }
      try {
        let user = await getUserByPhone(rawPhone);
        if (!user) user = await createUser(rawPhone);
        if (!user) {
          toast.error("Не удалось загрузить профиль");
          return;
        }
        setUserData(user);
      } catch (err) {
        toast.error("Ошибка загрузки профиля");
      } finally {
        setLoading(false);
      }
    })();
  }, [nav]);

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

  const premiumCheck = checkPremiumAccess(userData);

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="profile.user_info" onMenuClick={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="p-5 space-y-5">
        {/* User hero */}
        <section className="flex flex-col items-center text-center gap-3 py-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-[2.2rem] vaqta-gradient p-0.5 shadow-2xl">
              <div className="w-full h-full rounded-[2.1rem] bg-[#06140F] flex items-center justify-center">
                <User size={36} className="text-[#00A86B]" />
              </div>
            </div>
            {premiumCheck.isPremium && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#D4AF37] rounded-full border-4 border-[#06140F] flex items-center justify-center text-black">
                <Crown size={12} />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-black">{userData?.first_name || "VAQTA AI User"}</h2>
            <div className="flex items-center justify-center gap-1.5 text-[#5C7A6D] text-xs font-bold mt-1">
              <Phone size={11} className="text-[#00A86B]" />
              <span>{userData?.phone_number}</span>
            </div>
          </div>

          {/* 3 stat cards */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
            <div className="vaqta-glass p-3 text-center space-y-0.5">
              <Zap size={14} className="mx-auto text-[#00A86B]" />
              <p className="text-base font-black text-white">{userData?.ai_requests_used || 0}</p>
              <p className="text-[8px] uppercase font-black text-[#5C7A6D]">AI</p>
            </div>
            <div className="vaqta-glass p-3 text-center space-y-0.5">
              <Scan size={14} className="mx-auto text-purple-400" />
              <p className="text-base font-black text-white">{userData?.ocr_requests_used || 0}</p>
              <p className="text-[8px] uppercase font-black text-[#5C7A6D]">OCR</p>
            </div>
            <div className="vaqta-glass p-3 text-center space-y-0.5">
              <MapIcon size={14} className="mx-auto text-cyan-400" />
              <p className="text-base font-black text-white">{userData?.map_requests_used || 0}</p>
              <p className="text-[8px] uppercase font-black text-[#5C7A6D]">Maps</p>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section>
          <SectionLabel text={t("profile.subscription")} />
          <div className={`vaqta-glass p-5 border ${premiumCheck.isPremium ? "border-[#D4AF37]/40 shadow-[0_0_30px_rgba(212,175,55,0.1)]" : "border-[#1A3D2E]"}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">VAQTA AI</p>
                <h3 className={`text-lg font-black mt-0.5 ${premiumCheck.isPremium ? "vaqta-gold-text" : "text-white"}`}>
                  {premiumCheck.isPremium ? "PREMIUM" : "FREE"}
                </h3>
                {premiumCheck.isPremium && userData?.subscription_expires_at && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#D4AF37] mt-1.5">
                    <Clock size={10} />
                    <span>до {new Date(userData.subscription_expires_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              {!premiumCheck.isPremium && (
                <button onClick={() => nav("/premium")} className="bg-gradient-to-r from-[#00A86B] to-[#14B8A6] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg vaqta-glow">
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Main sections */}
        <section>
          <SectionLabel text={t("profile.section_main")} />
          <div className="space-y-2">
            <ProfileRow icon={Heart} label={t("profile.section_favorites")} onClick={() => toast.info(t("profile.favorites_empty"))} color="text-pink-400" />
            <ProfileRow icon={FileText} label={t("profile.section_history")} onClick={() => nav("/history")} color="text-blue-400" />
            <ProfileRow icon={Crown} label={t("profile.section_premium")} onClick={() => nav("/premium")} color="text-[#D4AF37]" badge={premiumCheck.isPremium ? "ACTIVE" : undefined} />
          </div>
        </section>

        {/* Data sections */}
        <section>
          <SectionLabel text={t("profile.section_data")} />
          <div className="space-y-2">
            <ProfileRow icon={Globe} label={`${t("profile.section_language")} · ${language.toUpperCase()}`} onClick={() => nav("/settings")} color="text-[#00A86B]" />
            <ProfileRow icon={Settings} label={t("profile.section_settings")} onClick={() => nav("/settings")} color="text-slate-400" />
          </div>
        </section>

        {/* Support */}
        <section>
          <SectionLabel text={t("profile.section_support")} />
          <div className="space-y-2">
            <ProfileRow icon={MessageCircle} label="Чат поддержки" onClick={() => toast.info("Поддержка: support@vaqta-ai.app")} color="text-[#00A86B]" />
            <ProfileRow icon={HelpCircle} label="Помощь / FAQ" onClick={() => nav("/ai")} color="text-amber-400" />
            <ProfileRow icon={ShieldCheck} label={t("privacy")} onClick={() => nav("/about")} color="text-slate-400" />
          </div>
        </section>

        {/* Admin */}
        <section>
          <SectionLabel text={t("profile.section_admin")} />
          <div className="space-y-2">
            <ProfileRow icon={Key} label={t("profile.admin_panel")} onClick={() => nav("/admin/login")} color="text-red-400" />
          </div>
        </section>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full vaqta-glass p-4 border-red-500/20 bg-red-500/5 flex items-center gap-3 active:scale-[0.99] transition-transform"
        >
          <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-500">
            <LogOut size={18} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-red-400">{t("logout")}</span>
        </button>

        <p className="text-center text-[9px] text-[#5C7A6D] uppercase font-black tracking-widest pt-2">
          {t("copyright")}
        </p>
      </main>

      <BottomNav />
    </div>
  );
}