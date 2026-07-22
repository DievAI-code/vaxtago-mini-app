"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, ChevronRight } from "lucide-react";
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

    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Введите полный номер телефона");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .upsert({
          phone_number: phone,
          last_login: new Date().toISOString(),
          role: 'user',
          language_code: document.documentElement.lang || 'uz'
        }, { 
          onConflict: 'phone_number' 
        })
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem("vaxtago_auth", "true");
      localStorage.setItem("vaxtago_user_data", JSON.stringify(data));
      
      toast.success("Muvaffaqiyatli kirish!");
      nav("/home", { replace: true });
    } catch (err: any) {
      console.error("Auth Error:", err);
      toast.error("Xatolik: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white items-center justify-center px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-6">
          <VaqtaLogo size={80} animated />
          <h1 className="text-4xl font-black tracking-tighter">VAQTA <span className="text-[#00A86B]">AI</span></h1>
          <p className="text-[#5C7A6D] text-sm font-medium">{t("auth.subtitle")}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-5 flex items-center text-[#00A86B]"><Phone size={18} /></div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (___) ___ __ __"
              className="w-full h-16 bg-[#0C1F1A] border border-[#1A3D2E] rounded-[1.5rem] pl-14 pr-4 text-white focus:outline-none focus:border-[#00A86B] transition-all font-bold"
            />
          </div>

          <button
            disabled={loading}
            className="w-full h-16 rounded-[1.5rem] vaqta-gradient flex items-center justify-center gap-3 text-lg font-black text-white shadow-xl disabled:opacity-50"
          >
            {loading ? "..." : t("common.continue")}
            <ChevronRight size={20} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}