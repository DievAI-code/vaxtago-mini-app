"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Phone, ChevronRight, Globe, AlertCircle } from "lucide-react";
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
      toast.error("Ошибка конфигурации. Проверьте VITE_SUPABASE_URL.");
      return;
    }

    if (phone.length < 10) {
      toast.error(t("auth.phone_placeholder"));
      return;
    }

    setLoading(true);
    try {
      // Пытаемся найти пользователя или создать нового (UPSERT)
      // onConflict: 'phone_number' гарантирует, что мы не создадим дубликат
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
        console.error("Supabase Auth Error:", error);
        throw new Error("DB_ERROR");
      }

      // Сохраняем локальную сессию
      localStorage.setItem("vaxtago_auth", "true");
      localStorage.setItem("vaxtago_user_phone", phone);
      localStorage.setItem("vaxtago_user_id", data.id);
      localStorage.setItem("vaxtago_user_data", JSON.stringify(data));
      
      toast.success("Muvaffaqiyatli kirish!");
      nav("/home", { replace: true });
    } catch (err: any) {
      toast.error("Kirishda xatolik yuz berdi. Tarmoqni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured()) {
    return (
      <div className="min-h-screen bg-[#06140F] flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Настройка не завершена</h2>
        <p className="text-slate-400 text-sm">Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в настройки Vercel.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white">
      <main className="flex-1 flex flex-col items-center justify-center px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-12">
          <div className="text-center space-y-6">
            <VaqtaLogo size={80} animated />
            <h1 className="text-4xl font-black tracking-tighter">VAQTA <span className="text-[#00A86B]">AI</span></h1>
            <p className="text-[#5C7A6D] text-sm font-medium">{t("auth.subtitle")}</p>
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
                  placeholder={t("auth.phone_placeholder")}
                  className="w-full h-16 bg-[#0C1F1A] border border-[#1A3D2E] rounded-[1.5rem] pl-14 pr-4 text-white focus:outline-none focus:border-[#00A86B] transition-all font-bold tracking-widest"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full h-16 rounded-[1.5rem] vaqta-gradient flex items-center justify-center gap-3 text-lg font-black text-white shadow-xl disabled:opacity-50"
            >
              {loading ? t("common.loading") : t("common.continue")}
              {!loading && <ChevronRight size={20} />}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}