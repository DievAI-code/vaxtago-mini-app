"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { supabase, clearSupabaseSession } from "@/integrations/supabase/client";
import { isConfigured } from "@/lib/env";
import { motion } from "framer-motion";

export default function Login() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Очищаем возможные проблемы с сессией
    await clearSupabaseSession();

    if (!isConfigured()) {
      toast.error("Supabase не настроен. Проверьте переменные окружения.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Введите корректный номер телефона (минимум 10 цифр)");
      return;
    }

    setLoading(true);
    
    try {
      // Расширенное логирование
      console.log('[Login] Attempting upsert for phone:', cleanPhone);
      console.log('[Login] Supabase client:', !!supabase);
      
      // Сначала пробуем найти существующего пользователя
      const { data: existingUser, error: selectError } = await supabase
        .from("users")
        .select("*")
        .eq("phone_number", cleanPhone)
        .maybeSingle();

      if (selectError) {
        console.error('[Login] Select error:', selectError);
      }

      let userData;
      
      if (existingUser) {
        // Обновляем существующего пользователя
        const { data, error } = await supabase
          .from("users")
          .update({
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("phone_number", cleanPhone)
          .select()
          .single();

        if (error) throw error;
        userData = data;
      } else {
        // Создаем нового пользователя
        const { data, error } = await supabase
          .from("users")
          .insert({
            phone_number: cleanPhone,
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            subscription_status: 'free',
            language_code: 'uz'
          })
          .select()
          .single();

        if (error) throw error;
        userData = data;
      }

      console.log('[Login] Upsert success:', userData);
      
      // Сохраняем пользователя
      localStorage.setItem("vaxtago_auth", "true");
      localStorage.setItem("vaxtago_user_data", JSON.stringify(userData));
      localStorage.setItem("vaxtago_user_phone", cleanPhone);
      
      toast.success("Добро пожаловать!");
      
      // Редирект в зависимости от наличия языка
      if (!userData.language_code || userData.language_code === 'uz') {
        nav("/language-select", { replace: true });
      } else {
        localStorage.setItem("vaxtago_language", userData.language_code);
        nav("/home", { replace: true });
      }
      
    } catch (err: any) {
      console.error('[Login] Error:', err);
      
      // Детальный анализ ошибки
      if (err.code === '23505') {
        toast.error("Этот номер телефона уже зарегистрирован");
      } else if (err.code === '42501') {
        toast.error("Ошибка доступа. Проверьте RLS политики");
      } else if (err.code === '409') {
        toast.error("Конфликт данных. Попробуйте еще раз");
      } else {
        toast.error(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
      }
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

        {/* Диагностическая информация */}
        <div className="text-center">
          <button 
            onClick={() => {
              console.log('Current Supabase client:', supabase);
              console.log('ENV configured:', isConfigured());
            }}
            className="text-xs text-[#5C7A6D] hover:text-[#00A86B]"
          >
            Диагностика подключения
          </button>
        </div>
      </motion.div>
    </div>
  );
}