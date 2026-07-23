"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Phone, Globe, Crown, Zap, Scan, 
  Map as MapIcon, Settings, LogOut, Trash2,
  ChevronRight, ArrowRight, Key, Clock, Calendar,
  ShieldCheck, Activity, FileText, Bell, Check,
  ShieldAlert, Lock, X, RefreshCw
} from "lucide-react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Lang } from "@/i18n";

const LANGUAGES: { code: Lang; name: string; flag: string }[] = [
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "uz", name: "O'zbekcha", flag: "🇺🇿" },
  { code: "tg", name: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "kk", name: "Қазақша", flag: "🇰🇿" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

export default function MyCabinet() {
  const { t, language, setLanguage } = useLanguage();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLangSelect, setShowLangSelect] = useState(false);
  
  // Admin Login States
  const [adminModal, setAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("vaqta_admin_token") === "true");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const phone = localStorage.getItem("vaxtago_user_phone");
    if (!phone) {
      nav("/login");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone_number", phone)
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetLang = async (code: Lang) => {
    setLanguage(code);
    localStorage.setItem("vaqta_language", code);
    setShowLangSelect(false);
    
    if (userData?.phone_number) {
      await supabase
        .from("users")
        .update({ language_code: code })
        .eq("phone_number", userData.phone_number);
    }
    toast.success(t("common.done"));
  };

  const handleAdminAuth = () => {
    if (localStorage.getItem("vaqta_admin_token") === "true") {
      nav("/admin");
      return;
    }
    setAdminModal(true);
  };

  const verifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode === "31975") {
      localStorage.setItem("vaqta_admin_token", "true");
      localStorage.setItem("vaqta_admin_role", "founder");
      setIsAdmin(true);
      setAdminModal(false);
      toast.success("Доступ администратора подтвержден");
      nav("/admin");
    } else {
      setAdminError(true);
      toast.error("Неверный код доступа");
    }
  };

  const clearCache = () => {
    localStorage.removeItem("vaxtago_chat_history");
    localStorage.removeItem("vaqta_doc_history");
    toast.success("Кеш приложения очищен");
  };

  const handleLogout = () => {
    localStorage.removeItem("vaxtago_auth");
    localStorage.removeItem("vaxtago_user_phone");
    localStorage.removeItem("vaxtago_user_data");
    localStorage.removeItem("vaqta_admin_token");
    localStorage.removeItem("vaqta_admin_role");
    nav("/login");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#06140F] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#00A86B]/20 border-t-[#00A86B] animate-spin rounded-full mb-4" />
      <p className="text-xs font-black uppercase text-[#00A86B] animate-pulse">VAQTA Loading...</p>
    </div>
  );

  const isPremium = userData?.subscription_status === 'premium';

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-40">
      <Header title="cabinet.title" onMenuClick={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="p-6 space-y-6">
        {/* SECTION: FOUNDER STATUS (VISIBLE ONLY IF LOGGED IN AS ADMIN) */}
        <AnimatePresence>
          {isAdmin && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="vaqta-glass p-6 border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/10 to-transparent relative overflow-hidden"
            >
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shadow-xl">
                  <Crown size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black vaqta-gold-text">👑 FOUNDER</h3>
                  <p className="text-xs font-bold text-[#D4AF37]/80 uppercase tracking-widest">Система управления VAQTA AI</p>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-10">
                <ShieldCheck size={120} className="text-[#D4AF37]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECTION: USER PROFILE CARD */}
        <section className="vaqta-glass p-6 border-[#1A3D2E] relative overflow-hidden">
          <div className="flex items-center gap-5 relative z-10">
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl vaqta-gradient flex items-center justify-center shadow-2xl">
                <User size={32} />
              </div>
              {isPremium && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#D4AF37] rounded-full border-2 border-[#06140F] flex items-center justify-center text-black">
                  <Crown size={12} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black truncate">{userData?.first_name || "VAQTA AI User"}</h2>
              <div className="flex items-center gap-2 text-[#5C7A6D] text-xs font-black uppercase tracking-widest mt-1">
                <Phone size={12} className="text-[#00A86B]" />
                <span>{userData?.phone_number}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/5">
            <div className="space-y-0.5">
              <p className="text-tiny uppercase text-[#5C7A6D] tracking-widest">Роль</p>
              <p className="text-sm font-bold text-white uppercase">{userData?.role || 'User'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-tiny uppercase text-[#5C7A6D] tracking-widest">Регистрация</p>
              <p className="text-sm font-bold text-white">{userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </section>

        {/* SECTION: ADMINISTRATION ACCESS ALWAYS VISIBLE */}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={handleAdminAuth}
          className="w-full p-5 vaqta-glass border-[#1A3D2E] bg-white/5 flex items-center justify-between group shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#00A86B]/10 text-[#00A86B]">
              <Key size={22} />
            </div>
            <div className="text-left">
              <p className="text-sm font-black uppercase text-white tracking-widest">{t("nav.admin")}</p>
              <p className="text-caption text-[#5C7A6D] uppercase">Project Control Unit</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-[#5C7A6D] group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* SECTION: PREMIUM STATUS */}
        <section className={`vaqta-glass p-6 border ${isPremium ? 'border-[#D4AF37]/40 shadow-[0_0_40px_rgba(212,175,55,0.1)]' : 'border-[#1A3D2E]'}`}>
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-tiny font-black uppercase tracking-[0.2em] text-[#5C7A6D] mb-1">{t("cabinet.subscription")}</p>
              <h3 className={`text-2xl font-black ${isPremium ? 'vaqta-gold-text' : 'text-slate-200'}`}>
                {isPremium ? 'VAQTA PREMIUM' : 'VAQTA FREE'}
              </h3>
            </div>
            {!isPremium && (
              <button 
                onClick={() => nav("/premium")}
                className="bg-[#00A86B] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg vaqta-glow"
              >
                {t("cabinet.upgrade")}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
            <Clock size={12} className={isPremium ? "text-[#D4AF37]" : "text-[#5C7A6D]"} />
            <span>
              {isPremium 
                ? `${t("cabinet.expires")}: ${userData?.subscription_expires ? new Date(userData.subscription_expires).toLocaleDateString() : '30 days'}` 
                : 'Limited Access Mode'}
            </span>
          </div>
        </section>

        {/* SECTION: ACTIVITY & USAGE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Activity size={16} className="text-[#00A86B]" />
            <h3 className="text-tiny font-black uppercase tracking-[0.2em] text-[#5C7A6D]">{t("cabinet.activity")}</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="vaqta-glass p-4 border-[#1A3D2E] text-center space-y-2">
              <Zap size={18} className="mx-auto text-[#00A86B]" />
              <p className="text-xl font-black">{userData?.ai_requests_used || 0}</p>
              <p className="text-tiny uppercase font-black text-[#5C7A6D] leading-tight">{t("cabinet.ai_queries")}</p>
            </div>
            <div className="vaqta-glass p-4 border-[#1A3D2E] text-center space-y-2">
              <Scan size={18} className="mx-auto text-purple-400" />
              <p className="text-xl font-black">{userData?.ocr_requests_used || 0}</p>
              <p className="text-tiny uppercase font-black text-[#5C7A6D] leading-tight">{t("cabinet.ocr_scans")}</p>
            </div>
            <div className="vaqta-glass p-4 border-[#1A3D2E] text-center space-y-2">
              <MapIcon size={18} className="mx-auto text-cyan-400" />
              <p className="text-xl font-black">{userData?.map_requests_used || 0}</p>
              <p className="text-tiny uppercase font-black text-[#5C7A6D] leading-tight">{t("cabinet.routes")}</p>
            </div>
          </div>
          
          <div className="px-2 flex items-center gap-2 text-caption text-[#5C7A6D]">
            <Clock size={12} />
            <span>Последний вход: {userData?.last_login ? new Date(userData.last_login).toLocaleString() : '—'}</span>
          </div>
        </section>

        {/* SECTION: DOCUMENTS & HISTORY */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <FileText size={16} className="text-slate-400" />
            <h3 className="text-tiny font-black uppercase tracking-[0.2em] text-[#5C7A6D]">{t("cabinet.documents")}</h3>
          </div>
          <div className="space-y-2">
            <button onClick={() => nav("/history")} className="w-full vaqta-glass p-5 border-[#1A3D2E] flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 text-[#00A86B]"><ShieldCheck size={18} /></div>
                <span className="text-sm font-bold uppercase tracking-widest">Проверенные документы</span>
              </div>
              <ChevronRight size={16} className="text-[#5C7A6D]" />
            </button>
            <button onClick={() => nav("/history")} className="w-full vaqta-glass p-5 border-[#1A3D2E] flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 text-purple-400"><Scan size={18} /></div>
                <span className="text-sm font-bold uppercase tracking-widest">История OCR</span>
              </div>
              <ChevronRight size={16} className="text-[#5C7A6D]" />
            </button>
          </div>
        </section>

        {/* SECTION: SETTINGS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Settings size={16} className="text-[#D4AF37]" />
            <h3 className="text-tiny font-black uppercase tracking-[0.2em] text-[#5C7A6D]">{t("cabinet.settings")}</h3>
          </div>
          
          <div className="space-y-2">
            {/* Language Selection */}
            <div className="vaqta-glass p-1 border-[#1A3D2E] overflow-hidden">
               <button 
                 onClick={() => setShowLangSelect(!showLangSelect)}
                 className="w-full p-4 flex items-center justify-between"
               >
                 <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-white/5 text-[#00A86B]"><Globe size={18} /></div>
                    <div className="text-left">
                       <p className="text-tiny font-black text-[#5C7A6D] uppercase mb-0.5">{t("cabinet.lang_select")}</p>
                       <p className="text-sm font-bold text-white uppercase">{LANGUAGES.find(l => l.code === language)?.name}</p>
                    </div>
                 </div>
                 <ChevronRight size={18} className={`text-[#5C7A6D] transition-transform ${showLangSelect ? 'rotate-90' : ''}`} />
               </button>

               <AnimatePresence>
                 {showLangSelect && (
                   <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-2 pb-2 space-y-1 overflow-hidden">
                      {LANGUAGES.map((l) => (
                        <button 
                          key={l.code}
                          onClick={() => handleSetLang(l.code)}
                          className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all ${language === l.code ? 'bg-[#00A86B]/10 text-[#00A86B] border border-[#00A86B]/20' : 'hover:bg-white/5'}`}
                        >
                           <div className="flex items-center gap-3">
                             <span className="text-lg">{l.flag}</span>
                             <span className="text-sm font-bold">{l.name}</span>
                           </div>
                           {language === l.code && <Check size={14} />}
                        </button>
                      ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* General Actions */}
            <div className="vaqta-glass p-5 border-[#1A3D2E] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 text-blue-400"><Bell size={18} /></div>
                <span className="text-sm font-bold uppercase tracking-widest">Уведомления</span>
              </div>
              <div className="w-10 h-5 bg-[#00A86B] rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>

            <button 
              onClick={clearCache}
              className="w-full vaqta-glass p-5 border-[#1A3D2E] flex items-center gap-4 active:scale-95 transition-transform"
            >
              <div className="p-2.5 rounded-xl bg-white/5 text-cyan-400"><RefreshCw size={18} /></div>
              <span className="text-sm font-black uppercase tracking-widest text-white">Очистить кеш приложения</span>
            </button>

            <button 
              onClick={handleLogout}
              className="w-full vaqta-glass p-5 border-red-500/20 bg-red-500/5 flex items-center gap-4 active:scale-95 transition-transform"
            >
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500"><LogOut size={18} /></div>
              <span className="text-sm font-black uppercase tracking-widest text-red-400">{t("cabinet.logout")}</span>
            </button>

            <button className="w-full p-4 text-caption font-black uppercase text-[#5C7A6D] tracking-widest flex items-center justify-center gap-2 mt-4 hover:text-red-400 transition-colors">
              <Trash2 size={12} /> {t("cabinet.delete_account")}
            </button>
          </div>
        </section>

        <p className="text-center text-tiny text-[#1A3D2E] font-black uppercase tracking-[0.5em] pt-8">
          VAQTA AI Core v3.1.2
        </p>
      </main>

      {/* ADMIN LOGIN MODAL */}
      <AnimatePresence>
        {adminModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setAdminModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="vaqta-glass w-full max-w-sm p-8 border-[#00A86B]/30 relative z-10"
            >
              <button onClick={() => setAdminModal(false)} className="absolute top-6 right-6 text-[#5C7A6D]"><X size={24}/></button>
              
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 rounded-3xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B] mx-auto">
                   <ShieldAlert size={32} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">VAQTA AI Administration</h3>
                <p className="text-caption text-[#5C7A6D] uppercase">Введите код доступа для входа</p>
              </div>

              <form onSubmit={verifyAdmin} className="space-y-6">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00A86B]" size={20} />
                  <input 
                    type="password"
                    autoFocus
                    value={adminCode}
                    onChange={(e) => { setAdminCode(e.target.value); setAdminError(false); }}
                    placeholder="•••••"
                    className={`w-full h-16 bg-[#06140F] border ${adminError ? 'border-red-500' : 'border-[#1A3D2E]'} rounded-2xl pl-12 text-center text-2xl tracking-[0.5em] font-mono focus:border-[#00A86B] outline-none transition-all`}
                  />
                </div>
                <button type="submit" className="w-full h-16 vaqta-gradient rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl vaqta-glow">
                  Подтвердить
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}