"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Phone, Crown, Zap, Scan, 
  Map as MapIcon, LogOut, 
  ArrowRight, Key, Clock, 
  ShieldCheck, ShieldAlert, Lock, RefreshCw, X
} from "lucide-react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone } from "@/lib/normalizePhone";
import { subscription } from "@/services/subscription";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function MyCabinet() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [adminModal, setAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [isAdmin, setIsAdmin] = useState(() => {
    const session = localStorage.getItem("vaqta_admin_session");
    return session ? JSON.parse(session).role === "founder" : false;
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const rawPhone = localStorage.getItem("vaxtago_user_phone");
    if (!rawPhone) return nav("/login");

    const phone = normalizePhone(rawPhone);
    if (!phone) return nav("/login");

    try {
      const { data, error } = await supabase.from("users").select("*").eq("phone_number", phone).maybeSingle();
      if (error) {
        toast.error("Не удалось загрузить профиль");
      } else {
        setUserData(data);
      }

      const aiAccess = await subscription.checkUserAccess("ai");
      const ocrAccess = await subscription.checkUserAccess("ocr");
      const mapAccess = await subscription.checkUserAccess("maps");

      const isUnlimited = aiAccess.isPremium || aiAccess.mode === "all";

      setUsage({
        status: isUnlimited ? "premium" : "free",
        mode: aiAccess.mode,
        ai_remaining: aiAccess.remaining,
        ocr_remaining: ocrAccess.remaining,
        map_remaining: mapAccess.remaining,
      });
    } catch (err) {
      console.error(err);
      toast.error("Не удалось загрузить данные профиля");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = () => {
    if (isAdmin) return nav("/admin");
    setAdminModal(true);
  };

  const verifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode === "31975") {
      const session = { authenticated: true, role: "founder", createdAt: Date.now() };
      localStorage.setItem("vaqta_admin_session", JSON.stringify(session));
      localStorage.setItem("vaqta_admin_token", "true");
      setIsAdmin(true);
      setAdminModal(false);
      toast.success("Режим Основателя активирован");
      nav("/admin");
    } else {
      toast.error("Неверный код доступа");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vaxtago_auth");
    localStorage.removeItem("vaxtago_user_phone");
    localStorage.removeItem("vaqta_admin_session");
    localStorage.removeItem("vaqta_admin_token");
    nav("/login");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#06140F] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#00A86B]/20 border-t-[#00A86B] animate-spin rounded-full mb-4" />
      <p className="text-xs font-black uppercase text-[#00A86B] animate-pulse">VAQTA loading...</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-40">
      <Header title="nav.cabinet" onMenuClick={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="p-6 space-y-6">
        {isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="vaqta-glass p-6 border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/20 via-transparent to-[#00A86B]/10 relative overflow-hidden"
          >
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shadow-xl">
                <Crown size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black vaqta-gold-text">👑 FOUNDER</h3>
                <p className="text-[10px] font-bold text-[#00A86B] uppercase tracking-[0.2em]">Полный доступ к системе</p>
              </div>
            </div>
            <ShieldCheck size={100} className="absolute -right-8 -bottom-8 opacity-5 text-[#D4AF37]" />
          </motion.div>
        )}

        <section className="vaqta-glass p-6 border-[#1A3D2E] relative overflow-hidden">
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-[1.8rem] vaqta-gradient flex items-center justify-center shadow-2xl">
              <User size={32} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black truncate">{userData?.first_name || "Пользователь"}</h2>
              <div className="flex items-center gap-2 text-[#5C7A6D] text-xs font-bold mt-1">
                <Phone size={12} className="text-[#00A86B]" />
                <span>{userData?.phone_number}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/5">
            <div>
              <p className="text-[9px] uppercase text-[#5C7A6D] font-black tracking-widest">Статус</p>
              <p className={`text-sm font-bold uppercase ${usage?.status === 'premium' ? 'text-[#D4AF37]' : 'text-white'}`}>
                {usage?.status}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase text-[#5C7A6D] font-black tracking-widest">Регистрация</p>
              <p className="text-sm font-bold text-white">
                {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </section>

        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={handleAdminAuth}
          className="w-full p-5 vaqta-glass border-[#1A3D2E] bg-white/5 flex items-center justify-between group shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#00A86B]/10 text-[#00A86B]"><Key size={22} /></div>
            <div className="text-left">
              <p className="text-sm font-black uppercase text-white tracking-widest">{t("nav.admin")}</p>
              <p className="text-[10px] font-bold text-[#5C7A6D] uppercase">Founder Control Center</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-[#5C7A6D] group-hover:translate-x-1 transition-transform" />
        </motion.button>

        <section className={`vaqta-glass p-6 border ${usage?.status === 'premium' ? 'border-[#D4AF37]/40 shadow-[0_0_40px_rgba(212,175,55,0.1)]' : 'border-[#1A3D2E]'}`}>
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-[10px] font-black uppercase text-[#5C7A6D] tracking-widest mb-1">{t("premium.title")}</p>
              <h3 className={`text-2xl font-black ${usage?.status === 'premium' ? 'vaqta-gold-text' : 'text-slate-200'}`}>
                VAQTA {usage?.status.toUpperCase()}
              </h3>
            </div>
            {usage?.status === 'free' && (
              <button onClick={() => nav("/premium")} className="bg-[#00A86B] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg vaqta-glow">
                {t("premium.buy")}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
            <Clock size={14} className={usage?.status === 'premium' ? "text-[#D4AF37]" : "text-[#5C7A6D]"} />
            <span>
              {usage?.status === 'premium' 
                ? (usage.mode === 'all' ? 'Безлимитный доступ (ALL USERS Mode)' : 'Premium активен') 
                : 'Лимитированный бесплатный доступ'}
            </span>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">Остаток лимитов на сегодня</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="vaqta-glass p-4 border-[#1A3D2E] text-center space-y-2">
              <Zap size={18} className="mx-auto text-[#00A86B]" />
              <p className="text-xl font-black">{usage?.ai_remaining === Infinity ? '∞' : usage?.ai_remaining}</p>
              <p className="text-[8px] uppercase font-black text-[#5C7A6D]">AI Осталось</p>
            </div>
            <div className="vaqta-glass p-4 border-[#1A3D2E] text-center space-y-2">
              <Scan size={18} className="mx-auto text-purple-400" />
              <p className="text-xl font-black">{usage?.ocr_remaining === Infinity ? '∞' : usage?.ocr_remaining}</p>
              <p className="text-[8px] uppercase font-black text-[#5C7A6D]">OCR Осталось</p>
            </div>
            <div className="vaqta-glass p-4 border-[#1A3D2E] text-center space-y-2">
              <MapIcon size={18} className="mx-auto text-cyan-400" />
              <p className="text-xl font-black">{usage?.map_remaining === Infinity ? '∞' : usage?.map_remaining}</p>
              <p className="text-[8px] uppercase font-black text-[#5C7A6D]">Карты</p>
            </div>
          </div>
        </section>

        <div className="space-y-2">
           <button 
              onClick={() => { localStorage.clear(); toast.success("Кеш очищен"); window.location.reload(); }}
              className="w-full vaqta-glass p-5 border-[#1A3D2E] flex items-center gap-4 active:scale-95 transition-transform"
            >
              <div className="p-2.5 rounded-xl bg-white/5 text-cyan-400"><RefreshCw size={18} /></div>
              <span className="text-sm font-black uppercase text-white tracking-widest">Очистить кеш</span>
            </button>

            <button 
              onClick={handleLogout}
              className="w-full vaqta-glass p-5 border-red-500/20 bg-red-500/5 flex items-center gap-4 active:scale-95 transition-transform"
            >
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500"><LogOut size={18} /></div>
              <span className="text-sm font-black uppercase tracking-widest text-red-400">{t("logout")}</span>
            </button>
        </div>
      </main>

      <AnimatePresence>
        {adminModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAdminModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="vaqta-glass w-full max-w-sm p-8 border-[#00A86B]/30 relative z-10">
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 rounded-3xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B] mx-auto"><ShieldAlert size={32} /></div>
                <h3 className="text-xl font-black uppercase tracking-tight">VAQTA AI Control</h3>
                <p className="text-xs text-[#5C7A6D] uppercase font-bold">Введите секретный код доступа</p>
              </div>

              <form onSubmit={verifyAdmin} className="space-y-6">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00A86B]" size={20} />
                  <input type="password" autoFocus value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="•••••" className="w-full h-16 bg-[#06140F] border border-[#1A3D2E] rounded-2xl pl-12 text-center text-2xl tracking-[0.5em] font-mono focus:border-[#00A86B] outline-none" />
                </div>
                <button type="submit" className="w-full h-16 vaqta-gradient rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl vaqta-glow">Верефицировать</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}