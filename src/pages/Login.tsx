"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Phone, ChevronRight, AlertCircle, Terminal } from "lucide-react";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isConfigured } from "@/lib/env";

export default function Login() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfigured()) {
      toast.error("VITE_SUPABASE_URL is missing in environment variables.");
      return;
    }

    // Базовая валидация номера
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Введите полный номер телефона");
      return;
    }

    setLoading(true);
    
    try {
      console.log("Attempting login for:", phone);

      const { data, error } = await supabase
        .from("users")
        .upsert({
          phone_number: phone,
          first_name: `User_${phone.slice(-4)}`,
          language_code: document.documentElement.lang || 'uz',
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: 'user'
        }, { 
          onConflict: 'phone_number' 
        })
        .select()
        .single();

      if (error) {
        // Детальный лог ошибки для разработчика
        console.group("Supabase Auth Error Details");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Details:", error.details);
        console.error("Hint:", error.hint);
        console.groupEnd();
        
        throw error;
      }

      // Успешная сессия
      localStorage.setItem("vaxtago_auth", "true");
      localStorage.setItem("vaxtago_user_phone", phone);
      localStorage.setItem("vaxtago_user_id", data.id);
      localStorage.setItem("vaxtago_user_data", JSON.stringify(data));
      
      toast.success("Вход выполнен успешно");
      nav("/home", { replace: true });
      
    } catch (err: any) {
      const msg = err.message || "Ошибка сервера. Попробуйте позже.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white">
      <main className="flex-1 flex flex-col items-center justify-center px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-12">
          <div className="text-center space-y-6">
            <VaqtaLogo size={80} animated />
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter">VAQTA <span className="text-[#00A86B]">AI</span></h1>
              <p className="text-[#5C7A6D] text-sm font-medium">{t("auth.subtitle")}</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">{t("auth.phone_label")}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center text-[#00A86B]"><Phone size={18} /></div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___ __ __"
                  className="w-full h-16 bg-[#0C1F1A] border border-[#1A3D2E] rounded-[1.5rem] pl-14 pr-4 text-white focus:outline-none focus:border-[#00A86B] transition-all font-bold"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full h-16 rounded-[1.5rem] vaqta-gradient flex items-center justify-center gap-3 text-lg font-black text-white shadow-xl disabled:opacity-50 active:scale-95 transition-transform"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t("common.loading")}</span>
                </div>
              ) : (
                <>
                  {t("common.continue")}
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>
          
          <div className="pt-4 text-center">
             <p className="text-[9px] text-[#5C7A6D] uppercase tracking-widest leading-relaxed">
               {t("auth.privacy_note")}
             </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}