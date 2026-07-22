"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, ChevronRight, Loader2 } from "lucide-react";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isConfigured } from "@/lib/env";
import { motion } from "framer-motion";

export default function Login() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured()) return;

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Введите корректный номер телефона");
      return;
    }

    setLoading(true);
    try {
      // 1. Пробуем найти или создать пользователя
      const { data, error } = await supabase
        .from("users")
        .upsert({
          phone_number: cleanPhone,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'phone_number' 
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Сохраняем сессию
      localStorage.setItem("vaxtago_auth", "true");
      localStorage.setItem("vaxtago_user_data", JSON.stringify(data));
      localStorage.setItem("vaxtago_user_phone", cleanPhone);
      
      // 3. Редирект: если язык не выбран — на выбор языка, иначе — домой
      if (!data.language_code) {
        nav("/language-select", { replace: true });
      } else {
        localStorage.setItem("vaxtago_language", data.language_code);
        toast.success("Xush kelibsiz!");
        nav("/home", { replace: true });
      }
      
    } catch (err: any) {
      toast.error(`Ошибка: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white items-center justify-center px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-6">
          <VaqtaLogo size={80} animated />
          <h1 className="text-4xl font-black tracking-tighter uppercase">VAQTA <span className="text-[#00A86B]">AI</span></h1>
          <p className="text-[#5C7A6D] text-sm font-medium">Aqlli yordamchi / Умный помощник</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-5 flex items-center text-[#00A86B]"><Phone size={18} /></div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 (__) ___ __ __"
              className="w-full h-16 bg-[#0C1F1A] border border-[#1A3D2E] rounded-3xl pl-14 pr-4 text-white focus:outline-none focus:border-[#00A86B] font-bold tracking-widest"
            />
          </div>

          <button
            disabled={loading}
            className="w-full h-16 rounded-3xl vaqta-gradient flex items-center justify-center gap-3 text-lg font-black text-white shadow-xl disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>{t("common.continue") || "Продолжить"} <ChevronRight size={20} /></>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}