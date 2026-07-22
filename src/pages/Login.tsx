"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Phone, Globe, ChevronRight } from "lucide-react";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { useLanguage } from "@/context/LanguageProvider";
import { useApp } from "@/lib/theme";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const LANGS = [
  { code: "uz", name: "O'zbekcha", flag: "🇺🇿" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "tg", name: "Тоҷикӣ", flag: "🇹🇯" },
];

export default function Login() {
  const { t, setLanguage } = useLanguage();
  const { setLang } = useApp();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast.error(t("common.error"));
      return;
    }

    setLoading(true);
    
    try {
      // Использование upsert позволяет автоматически создать или обновить пользователя
      // по уникальному полю phone_number
      const { data, error } = await supabase
        .from("users")
        .upsert({
          phone_number: phone,
          first_name: "User_" + phone.slice(-4),
          language_code: document.documentElement.lang || "uz",
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'phone_number' 
        })
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem("vaxtago_auth", "true");
      localStorage.setItem("vaxtago_user_phone", phone);
      
      toast.success(t("common.done"));
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("[Login Error]:", err.message);
      toast.error("Ошибка при входе. Пожалуйста, попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  const changeLang = (code: any) => {
    setLanguage(code);
    setLang(code);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-12"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <VaqtaLogo size={80} animated glow />
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter">VAQTA <span className="text-[#00A86B]">AI</span></h1>
              <p className="text-[#5C7A6D] text-sm font-medium leading-relaxed max-w-[240px] mx-auto">
                {t("auth.subtitle")}
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D] ml-2">
                {t("auth.phone_label")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center text-[#00A86B]">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("auth.phone_placeholder")}
                  className="w-full h-16 bg-[#0C1F1A] border border-[#1A3D2E] rounded-[1.5rem] pl-14 pr-4 text-white focus:outline-none focus:border-[#00A86B] transition-all font-bold tracking-widest"
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              className="w-full h-16 rounded-[1.5rem] vaqta-gradient flex items-center justify-center gap-3 text-lg font-black text-white shadow-xl vaqta-glow disabled:opacity-50"
            >
              {loading ? t("common.loading") : t("common.continue")}
              {!loading && <ChevronRight size={20} />}
            </motion.button>
          </form>

          <div className="space-y-4">
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
              {t("auth.select_lang")}
            </p>
            <div className="flex justify-center gap-3">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => changeLang(l.code)}
                  className={`px-4 py-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-2 ${
                    document.documentElement.lang === l.code 
                    ? "bg-[#00A86B]/10 border-[#00A86B] text-[#00A86B]" 
                    : "bg-[#0C1F1A] border-[#1A3D2E] text-[#5C7A6D]"
                  }`}
                >
                  <span>{l.flag}</span>
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}